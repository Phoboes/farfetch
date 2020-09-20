Pokemon = require('../models/pokemonModel');
const $ = require('cheerio');
const rp = require('request-promise');
const fetch = require("node-fetch");

const baseURL = 'https://pokemon.fandom.com';
const pokeIndex = '/wiki/List_of_Pokémon';
let timer = 0;
const genNum = 1;

const newPokemon = {
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
        await parseTable( genTables[i], ( i + 1 ) );
        console.log('-----------------------');
        console.log('-----------------------');
        console.log(`Table ${ i + 1} done, ${ timer / 60000 } minutes.`);
        console.log('-----------------------');
        console.log('-----------------------');

      }
      console.log(`Complete. Time: ${ timer / 60000 } minutes.`);
      clearInterval(timerID);
    }

    async function parseTable ( gen, tableNum ){

      // The table the pokemon is found on is its generation
      newPokemon.generation = tableNum;
      // This is an annoying utility function to make sure there's a text value in an <a> tag so I can get a pokemon name from it.
      const getUrlData = ( urls ) => {
        for( let i = 0; i< urls.length; i++ ){
          if( urls[i].attribs.title !== undefined ){
            return urls[i];
          }
        }
      };

      //  handles extracting pokemon heights/weights from individual views.
        // Some pages have multiple values, others have no metric values; the logic works around that.
      const getMetric = ( html ) => {
        const metrics = $("[title='Metric']", html);
        const parsedVals = [];
        for (let i = 0; i < metrics.length; i++) {
          if (metrics[i].children[0].data !== undefined && metrics[i].children.length < 2) {
            parsedVals.push(metrics[i].children[0].data);
          } else if ( metrics[i].children.length >= 2 ) {
            // Handles multiple metrics values and hunts for the average.
            const avg = $("[title='Average']", metrics[i])[0].children[0].data;
            parsedVals.push( avg );
          }
        }
        // Did you know some pokemon are missing metric values and need to be converted from imperial? me neither.
        if(parsedVals.length < 2){
          const imperials = $("[title='Imperial']", html);
          //  lbs to kg
          parsedVals[0] = (parseFloat((imperials[0].children[0].data)) * 0.453592.toFixed(2) + ' kg');
          // ft/in to m
          const splitText = imperials[1].children[0].data.split("'");
          const inches = ( parseInt( splitText[0] ) * 12 ) + parseInt( splitText[1] );
          parsedVals[1] = ( inches / 39.37 ).toFixed(2);
        }
        return parsedVals;
      }

      // Iterating tables for each generation. The first TR is a header, so we skip it with let 1.
      for( let i = 1; i < $( 'tr', gen ).length; i++ ){

        const singlePokemonRow = $( 'tr', gen )[i];
        const urls = $( 'a', singlePokemonRow );
        const nameUrl = getUrlData( urls );

        // Find a link with a text value (this will be the pokemon name), save the value directly to our pokemon
        newPokemon.name = nameUrl.attribs.title;
        // Get the index while we're at it. I decided to grab it from the site rather than use i, as we'll be iterating multiple tables (and i will reset every table).
        newPokemon.index = parseInt( $( 'td', singlePokemonRow )[0].children[0].data );

        // Save the partial URL (ie /wiki/bulbasaur/ for deeper page scraping)
        const pokeUrl = nameUrl.attribs.href;
        const typelist = $('span', singlePokemonRow);
        const types = [];

        // Find the types of the pokemon in column (ie grass/flying)

        for( let j = 0; j < typelist.length; j++ ){
          if ( typelist[j].children[0].data !== undefined && (/.+(type).+/).test(typelist[j].attribs.class) ){
            types.push( typelist[j].children[0].data );
          }
        }

        // TODO -- Some pokemon have lots of types. Handle that.
        // Concat multiple types or store a single.
        newPokemon.elementType = types.length > 1 ? `${types[0]}/${types[1]}` : types[0];

        // Going deeper:
          // Access the single page view of each pokemon we scrape using the /wiki/{pokemonName} above
        const singlePageScrape = ( wikiUrl ) => {
          return new Promise( resolve =>
            {
              rp( baseURL + wikiUrl ).then(( singleViewHtml ) => {

                const metrics = getMetric( singleViewHtml );
                newPokemon.weight = metrics[0];
                newPokemon.height = metrics[1];

                // images for later use:
                newPokemon.images.cardImage = $('.pi-image-thumbnail', singleViewHtml)[0].attribs.src;
                newPokemon.images.cardSprite = $('h2 .image img', singleViewHtml)[0].attribs["data-src"];
                desc = $('.pokedex_entry p', singleViewHtml);

                // Sword and shield pokemon currently have broken/missing descriptions, this code is mostly to avoid them.
                if (desc.children !== undefined || desc.children.length === 0) {
                  // debugger
                  if ( desc[0].children[0] !== undefined ){
                    newPokemon.description = desc[0].children[0].data;
                  }
                }

                const images = $('.pi-smart-group-body .image img', singleViewHtml);

                // Try for all the evolution sprites on the page, there aren't classes so we need annoying selectors to find what we need
                  //  Ignore the img if it has the "Shape" tag -- it's a weird dinosaur thing
                  //  Ignore the shape if it's under 20px wide -- It's probably a footprint sprite.
                for( let i = 0; ( i < images.length ); i++ ){
                  if (!/(Shape)/.test(images[i].attribs.alt) && images[i].attribs.width > 20 ){
                    newPokemon.images.sprites.push(images[i].attribs["data-src"])
                  }
                }
                resolve( newPokemon );
              })
            })
        }

        const fetchPokemonAPI = async (name) => {

          //  I don't want to talk about it.
          name = name.toLowerCase()
          .replace(/(é+)/g, "e")
          .replace("♀", "-f")
          .replace("♂", "-m")
          .replace(" ", "-")
          .replace(".", "")
          .replace("'", "")
          .replace(":", "")
          .replace('deoxys', "deoxys-normal")
          .replace('wormadam', "wormadam-plant")
          .replace('giratina', "giratina-altered")
          .replace('shaymin', "shaymin-land")
          .replace('basculin', "basculin-red-striped")
          .replace("darmanitan", "darmanitan-standard")
          .replace("tornadus", "tornadus-incarnate")
          .replace("thundurus", "thundurus-incarnate")
          .replace("landorus", "landorus-incarnate")
          .replace("keldeo", "keldeo-ordinary")
          .replace("meloetta", "meloetta-aria")
          .replace("meowstic", "meowstic-male")
          .replace("aegislash", "aegislash-shield")
          .replace("pumpkaboo", "pumpkaboo-average")
          .replace("gourgeist", "gourgeist-average")
          .replace("oricorio", "oricorio-pom-pom")
          .replace("lycanroc", "lycanroc-midnight")
          .replace("wishiwashi", "wishiwashi-solo")
          .replace("minior", "minior-red-meteor")
          .replace("sirfetchd", "sirfetch")
          .replace("mr-rime", "mr")
          .replace("mimikyu", "mimikyu-disguised");

          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${ name }`)

          if (!res.ok) {
            const message = `An error has occured: ${res.status}`;
            throw new Error(message);
          }

          const json = await res.json()
          return json;
        }

        // The API is vicious and breaks things if it doesn't get what it expects. If it's misbehaving; keep the values empty.
        const pokeApiResults = await fetchPokemonAPI(newPokemon.name).catch( (e) => { return { abilities: '', sprites: []} } );

        newPokemon.moves = pokeApiResults.abilities;
        newPokemon.images.other = pokeApiResults.sprites;

        const result = await singlePageScrape( pokeUrl );
        console.log(`Index: ${ newPokemon.index }, ${ newPokemon.name }, ${ baseURL + pokeUrl }, Gen:${ newPokemon.generation }`);
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
// console.log( `Complete. Time: ${ timer / 60000 }` );
// clearInterval(timerID);