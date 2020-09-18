Pokemon = require('../models/pokemonModel');
const $ = require('cheerio');
const rp = require('request-promise');
const baseURL = 'https://pokemon.fandom.com';
const pokeIndex = '/wiki/List_of_Pokémon';

const newPokeData = {
    name: '',
    index: null,
    generation: '',
    height: '',
    weight: '',
    elementType: '',
    // images: [],
    moves: [],
    description: ''
};

rp( baseURL + pokeIndex )
  .then(function(html){
    console.log('--------Success--------');
    const genTables = $( '.wikitable', html );
    console.log( `Tables/Generations found: ${ genTables.length }.` );

    // Start with a single table; convert iterate them all later.
    // const thisGen = genTables[0];

    // console.log( $( 'tr', thisGen ).length );

    // parseTable( thisGen )

    for( let i = 0; i < genTables.length; i++ ){
      parseTable( genTables[i] );
    }

    function parseTable ( gen ){

      // This is an annoying utility function to make sure there's a text value in an <a> tag so I can get a pokemon name from it.
      const getUrlData = ( urls ) => {
        for( let i = 0; i< urls.length; i++ ){
          if( urls[i].attribs.title !== undefined ){
            return urls[i];
          }
        }
      };

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

        // Going deeper:

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