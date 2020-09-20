Pokemon = require('../models/pokemonModel');
const filter = require('./filter')
const $ = require('cheerio');
const rp = require('request-promise');
// const fetch = require("node-fetch");
const { html } = require('cheerio');

const baseURL = 'https://pokemon.fandom.com';
const pokeIndex = '/wiki/List_of_Pokémon';
let timer = 0;
const genNum = 1;

// Begin timer for total task.
const timerID = setInterval(() => {
    timer += 100;
  }, 100);

rp( baseURL + pokeIndex )
  .then(function(html){
    console.log('--------Success--------');
    const genTables = $( '.wikitable', html );
    console.log( `Tables/Generations found: ${ genTables.length }.` );
    console.log('-----------------------');

    cycleTables();

    async function cycleTables (){
      for( let i = (genNum - 1); i < genTables.length; i++ ){
        await parseTable( genTables[i] );
        console.log('-----------------------');
        console.log('-----------------------');
        console.log(`Table ${ i + 1} done, ${ timer / 60000 } minutes.`);
        console.log('-----------------------');
        console.log('-----------------------');

      }
      console.log(`Complete. Time: ${ timer / 60000 } minutes.`);
      clearInterval(timerID);
    }

    async function parseTable ( gen ){

      // Iterating tables for each generation. The first TR is a header, so we skip it with let 1.
      for( let i = 1; i < $( 'tr', gen ).length; i++ ){

        const singlePokemonRow = $( 'tr', gen )[i];
        const urls = $( 'a', singlePokemonRow );
        const nameUrl = filter.getUrlData( urls );
        const nameTag = nameUrl.attribs.title;

        // Save the partial URL (ie /wiki/bulbasaur/ for deeper page scraping)
        const pokeUrl = nameUrl.attribs.href;
        const newPokemon = new Pokemon;

        // Going deeper:
          // Access the single page view of each pokemon we scrape using the /wiki/{pokemonName} above
        const singlePageScrape = ( wikiUrl ) => {
          return new Promise( resolve =>
            {
              rp( baseURL + wikiUrl ).then(( singleViewHtml ) => {
                newPokemon.name = nameTag;
                const parentCard = filter.getThisPokemonCard(singleViewHtml, newPokemon);
                const metrics = filter.getMetric(parentCard);
                newPokemon.weight = metrics.weight;
                newPokemon.height = metrics.height;

                newPokemon.moves = filter.getAbilities( parentCard );
                newPokemon.elementType = filter.getTypes(parentCard);
                newPokemon.index = filter.getIndex(parentCard);
                newPokemon.generation = filter.getGen( parentCard );
                // images for later use:
                newPokemon.images.cardImage = $('.pi-image-thumbnail', parentCard)[0].attribs.src;
                newPokemon.images.cardSprite = $('h2 .image img', parentCard)[0].attribs["data-src"];

                //  TODO Descriptions are broken frequently by terrible formatting. This needs a lot of tweaking.
                desc = $('.pokedex_entry p', singleViewHtml);
                // Sword and shield pokemon currently have broken/missing descriptions, this code is mostly to avoid them.
                if( desc.length ){
                  if (desc.children !== undefined || desc.children.length === 0) {
                    if (desc[0].children[0] !== undefined) {
                      newPokemon.description = desc[0].children[0].data;
                    }
                  }
                } else {
                  newPokemon.description = '';
                }


                const images = $('.pi-smart-group-body .image img', singleViewHtml);

                // Try for all the evolution sprites on the page, there aren't classes so we need annoying selectors to find what we need
                  //  Ignore the img if it has the "Shape" tag -- it's a weird dinosaur thing
                  //  Ignore the shape if it's under 20px wide -- It's probably a footprint sprite.
                for( let i = 0; ( i < images.length ); i++ ){
                  if (!/(Shape)/.test(images[i].attribs.alt) && images[i].attribs.width > 20 ){
                    newPokemon.images.push(images[i].attribs["data-src"])
                  }
                }
                resolve( newPokemon );
              })
            })
        }


        const result = await singlePageScrape( pokeUrl );
        console.log(`Index: ${ newPokemon.index }, ${ newPokemon.name }, ${ baseURL + pokeUrl }, ${ newPokemon.generation }`);
        console.log( newPokemon.images.cardImage );
        console.log( newPokemon.elementType );
        console.log(`Weight: ${newPokemon.weight}, height: ${newPokemon.height}` );
        console.log( `Moves: ${newPokemon.moves.length}` );
        console.log(newPokemon.description);
        console.log('-----------------------');
        }

    };


  }) // End of successful response
  .catch(function(err){
    //handle error
    console.log("You done messed up A-Aron!");
    console.log( err );
    clearInterval(timerID);
  }); // End of error handling





// NEW POKEMON TEMPLATE
// exports.new = function (req, res) {
//     var pokemon = new Pokemon();
//     pokemon.name = req.body.name ? req.body.name : pokemon.name;
//     pokemon.index = req.body.index;
//     pokemon.height = req.body.height;
//     pokemon.weight = req.body.weight;
//     pokemon.elementType = req.body.elementType;
//     // pokemon.images = req.body.images;
//     pokemon.moves = req.body.moves;
//     pokemon.description = req.body.description;
    
//     // save the pokemon and check for errors
//     pokemon.save(function (err) {
//         if (err)
//             res.json(err);
            
//             res.json({
//             message: 'New pokemon created!',
//             data: pokemon
//         });
//     });
// };
// console.log( `Complete. Time: ${ timer / 60000 }` );
// clearInterval(timerID);