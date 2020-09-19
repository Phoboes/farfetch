Pokemon = require('../models/pokemonModel');
const $ = require('cheerio');
const rp = require('request-promise');
const fetch = require("node-fetch");

const baseURL = 'https://pokemon.fandom.com';
const pokeIndex = '/wiki/List_of_Pokémon';

const newPokeData = {
    name: '',
    index: null,
    generation: '',
    height: '',
    weight: '',
    elementType: '',
    images: {
      cardImage: "",
      cardSprite: "",
      sprites: [],
      other: []
    },
    moves: [],
    description: ''
};

const pokeImageData = {
  cardImage: "",
  cardSprite: "",
  sprites: []
};

rp( baseURL + pokeIndex )
  .then(function(html){
    console.log('--------Success--------');
    const genTables = $( '.wikitable', html );
    console.log( `Tables/Generations found: ${ genTables.length }.` );

    cycleTables();

    async function cycleTables (){
      for( let i = 0; i < genTables.length; i++ ){
        await parseTable( genTables[i], ( i + 1 ) );
      }
    }

    async function parseTable ( gen, tableNum ){

      // The table the pokemon is found on is its generation
      newPokeData.generation = tableNum;
      // This is an annoying utility function to make sure there's a text value in an <a> tag so I can get a pokemon name from it.
      const getUrlData = ( urls ) => {
        for( let i = 0; i< urls.length; i++ ){
          if( urls[i].attribs.title !== undefined ){
            return urls[i];
          }
        }
      };

      const getMetric = ( spans ) => {
        const metric = []
        for( let i = 0; i < spans.length; i++ ){
          if( spans[i].attribs.title !== undefined && spans[i].attribs.title === "Metric" ){
            metric.push( spans[i] );
          }
        }
        return metric;
      }

      // Iterating tables for each generation. The first TR is a header, so we skip it with let = 1.
      for( let i = 1; i < $( 'tr', gen ).length; i++ ){

        const singlePokemonRow = $( 'tr', gen )[i];
        const urls = $( 'a', singlePokemonRow );
        const nameUrl = getUrlData( urls );

        // Find a link with a text value (this will be the pokemon name), save the value directly to our pokemon
        newPokeData.name = nameUrl.attribs.title;
        // Get the index while we're at it. I decided to grab it from the site rather than use i, as we'll be iterating multiple tables (and i will reset every table).
        newPokeData.index = parseInt( $( 'td', singlePokemonRow )[0].children[0].data );

        // Save the partial URL (ie /wiki/bulbasaur/ for deeper page scraping)
        const pokeUrl = nameUrl.attribs.href;
        console.log( `Index: ${ newPokeData.index }, ${ newPokeData.name }, ${ pokeUrl }` );
        const typelist = $('span', singlePokemonRow);
        const types = [];

        // Find the types of the pokemon in column (ie grass/flying)
        for( let j = 0; j < typelist.length; j++ ){
          if ( typelist[j].children[0].data !== undefined && (/.+(type).+/).test(typelist[j].attribs.class) ){
            types.push( typelist[j].children[0].data );
          }
        }

        // Concat multiple types or store a single.
        newPokeData.elementType = types.length > 1 ? `${types[0]}/${types[1]}` : types[0];

        // Going deeper:
          // Access the single page view of each pokemon we scrape using the /wixi/pokemonName above
        const singlePageScrape = ( wikiUrl ) => {
          return new Promise( resolve =>
            {
              rp( baseURL + wikiUrl ).then(( singleViewHtml ) => {
                // const title = $('.page-header__title', singleViewHtml).text();
                // const height = $('span', singleViewHtml);
                const metrics = getMetric( $('span', singleViewHtml) );
                newPokeData.weight = metrics[0].children[0].data;
                newPokeData.height = metrics[1].children[0].data

                // images for later use:
                newPokeData.images.cardImage = $('.pi-image-thumbnail', singleViewHtml)[0].attribs.src;
                newPokeData.images.cardSprite = $('h2 .image img', singleViewHtml)[0].attribs["data-src"];
                const images = $('.pi-smart-group-body .image img', singleViewHtml);
                // const spriteArr = [];

                // Try for all the evolution sprites on the page, there aren't classes so we need annoying selectors to find what we need
                  //  Ignore the img if it has the "Shape" tag -- it's a weird dinosaur thing
                  //  Ignore the shape if it's under 20px wide -- It's probably a footprint sprite.
                for( let i = 0; ( i < images.length ); i++ ){
                  if (!/(Shape)/.test(images[i].attribs.alt) && images[i].attribs.width > 20 ){
                    newPokeData.images.sprites.push(images[i].attribs["data-src"])
                  }
                }

                resolve( newPokeData );


              })
            })
        }

        const fetchPokemonAPI = async (name) => {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${ name.toLowerCase() }`)
          const json = await res.json()
          return json;
        }

        const pokeApiResults = await fetchPokemonAPI(newPokeData.name);

        newPokeData.moves = pokeApiResults.abilities;
        newPokeData.images.other = pokeApiResults.sprites;

        const result = await singlePageScrape( pokeUrl );
        // console.log( result.cardImage );
        console.log( newPokeData.elementType );
        console.log(`Weight: ${newPokeData.weight}, height: ${newPokeData.height}` );
        console.log('-----------------------');
        }

    };


  }) // End of successful response
  .catch(function(err){
    //handle error
    console.log("You done messed up A-Aron!");
    console.log( err )
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