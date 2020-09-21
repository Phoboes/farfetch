Pokemon = require('../models/pokemonModel');
const filter = require('./filter')
const $ = require('cheerio');
const rp = require('request-promise');
const mongoose = require('mongoose');
Pokemon.collection.drop();
console.log( "DB cleared." )

mongoose.connect(`mongodb://localhost/farFetch`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection

// Added check for DB connection
if (!db){
  console.log("Error connecting db")
} else {
  console.log("Db connected successfully")
}

const baseURL = 'https://pokemon.fandom.com';
const pokeIndex = '/wiki/List_of_Pokémon';
const genNum = 1;

rp(baseURL + pokeIndex)
  .then(function (html) {
    console.log('--------Starting--------');
    const genTables = $('.wikitable', html);
    cycleTables(genTables);

    async function cycleTables(table) {
      let timer = 0;
      const timerID = setInterval(() => {
        timer += 100;
      }, 100);

      for (let i = (genNum - 1); i < table.length; i++) {
        await parseTable(table[i]);
        console.log('-----------------------');
        console.log(`Table ${ i + 1} done, ${ timer / 60000 } minutes.`);
        console.log('-----------------------');
      }
      console.log(`Complete. Time: ${ timer / 60000 } minutes.`);
      clearInterval(timerID);
    };

    async function parseTable(gen) {
      // Iterating tables/rows for each generation. The first TR is a header, so we skip it with let 1.
      for (let i = 1; i < $('tr', gen).length; i++) {

        const singlePokemonRow = $('tr', gen)[i];
        const urls = $('a', singlePokemonRow);
        const nameUrl = filter.getUrlData(urls);
        const nameTag = nameUrl.attribs.title;
        // Save the partial URL (ie /wiki/bulbasaur/ for deeper page scraping)
        const pokeUrl = nameUrl.attribs.href;

        // Going deeper:
        // Access the single page view of each pokemon we scrape using the /wiki/{pokemonName} above
        const singlePageScrape = async (wikiUrl) => {
          return new Promise(resolve => {
            rp(baseURL + wikiUrl).then( async function(singleViewHtml){
              const cardList = $($('.pi-section-content', singleViewHtml), singleViewHtml);
              let newPokemon;
              if( cardList.length ){
                for( let i = 0; i < cardList.length; i++ ){
                  // const newPokemon = new Pokemon();
                  newPokemon = filter.getPokeData( {}, singleViewHtml, cardList[i]);
                  filter.logResponse(newPokemon, baseURL);

                  await Pokemon.create(newPokemon).then(
                    ( pokemon )=>{ console.log( "Saved to db." ) })
                    .catch( (e) => { console.log(e.toJSON()) } );
                }
              } else {
                // const newPokemon = new Pokemon();
                newPokemon = filter.getPokeData( {}, singleViewHtml);
                filter.logResponse(newPokemon, baseURL);

                await Pokemon.create(newPokemon)
                .then(( pokemon )=>{ console.log( "Saved to db." ) })
                .catch( (e) => { console.log(e.toJSON()) } );
              }
              resolve(newPokemon);
            })
          })
        };

        await singlePageScrape(pokeUrl);
      }
    };
  }) // End of successful response
  .catch(function (err) {
    //handle error
    console.log("You done messed up A-Aron!");
    console.log(err);
    clearInterval(timerID);
  }); // End of error handling
