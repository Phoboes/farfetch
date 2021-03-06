const $ = require('cheerio');
const PageFilter = {

    getMetric: function (html) {
        const metrics = $("[title='Metric']", html);
        const parsedVals = [];
        for (let i = 0; i < metrics.length; i++) {
            if (metrics[i].children[0].data !== undefined && metrics[i].children.length < 2) {
                parsedVals.push(metrics[i].children[0].data);
            } else if (metrics[i].children.length >= 2) {
                // Handles multiple metrics values and hunts for the average.
                const avg = $("[title='Average']", metrics[i])[0].children[0].data;
                parsedVals.push(avg);
            }
        }
        // Did you know some pokemon are missing metric values and need to be converted from imperial? me neither.
        if (parsedVals.length < 2) {
            const imperials = $("[title='Imperial']", html);
            if( imperials.length === 2 ){
                //  lbs to kg
                parsedVals[0] = (parseFloat((imperials[0].children[0].data)) * 0.453592.toFixed(2) + ' kg');
                // ft/in to m
                const splitText = imperials[1].children[0].data.split("'");
                const inches = (parseInt(splitText[0]) * 12) + parseInt(splitText[1]);
                parsedVals[1] = (inches / 39.37).toFixed(2);
            }
        }

            return {
                weight: parsedVals[0] || '',
                height: parsedVals[1] || ''
            };
    },

    getPokeData: function(pokemon, html, card = html){
        // pokemon = new Pokemon;
        pokemon.name = $('h2[data-source*="name"]', card)[0].children[0].data;
        const metrics = this.getMetric(card);
        pokemon.weight = metrics.weight;
        pokemon.height = metrics.height;
        pokemon.moves = this.getAbilities(card);
        pokemon.elementType = this.getTypes(card);
        pokemon.index = this.getIndex(card);
        pokemon.generation = this.getGen(card);

        // images for later use:
        pokemon.images = this.getImages(card);
        pokemon.description = this.getDescription(html);

        return pokemon;
    },

    getTypes: function (html) {
        const typeList = $(".image[title*=' type']", html);
        const cleanedTypes = [];
        for (let i = 0; i < typeList.length; i++) {
            cleanedTypes.push(typeList[i].attribs.title.replace(" type", ""));
        }
        return cleanedTypes.length > 1 ? `${cleanedTypes[0]}/${cleanedTypes[1]}` : cleanedTypes[0];
    },

    // TODO: Transition these to models and an uploader and validate the data.
    getImages: function (html) {
        const images = $('.pi-smart-group-body .image img', html);
        const imageCollection = [];

        imageCollection[0] = ($('section[data-item-name = "title"] img', html).length > 0) ? $('section[data-item-name = "title"] img', html)[0].attribs["data-src"] : '';
        imageCollection[1] = $('figure img', html)[0].attribs.srcset.match(/\s(https:\/\/.+)\s2/)[1];
        // Try for all the evolution sprites on the page, there aren't classes so we need annoying selectors to find what we need
        //  Ignore the img if it has the "Shape" tag -- it's a weird dinosaur thing
        //  Ignore the shape if it's under 20px wide -- It's probably a footprint sprite.
        for (let i = 0;
            (i < images.length); i++) {
            const sprites = [];
            if (!/(Shape)/.test(images[i].attribs.alt) && images[i].attribs.width > 20) {
                sprites.push(images[i].attribs["data-src"])
            }
            imageCollection.push(sprites);
        }

        return imageCollection;
    },

    getAbilities: function (html) {
        const abilities = [];
        // The only properly labelled ability item is a buried sibling to the container, so we gotta dig... up. Then back down. But not too down.
        const abilityList = $("[title*=' Abilities']", html).parent().parent().children().find('a').not('sup a').not('h3 a');
        for (let i = 0; i < abilityList.length; i++) {
            abilities.push(abilityList[i].attribs.title);
        }
        return abilities;
    },

    getIndex: function (html) {
        // return parseInt($('div[data-source*="ndex"]', html)[0].children[0].data);
        return parseInt($('.pi-smart-group-body div[data-source*="ndex"]', html)[1].children[0].data);
    },

    getGen: function (html) {
        return $('[title^="Genera"]', html)[0].children[0].data;
    },

    getUrlData(urls) {
        // Traverses the list of links in a given table rom for the first with a title which contains a name & href.
        for (let i = 0; i < urls.length; i++) {
            if (urls[i].attribs.title !== undefined) {
                return urls[i];
            }
        }
    },

    //  TODO Descriptions are broken frequently by terrible formatting. This needs a lot of tweaking.
    getDescription(html) {
        desc = $('.pokedex_entry p', html);
        // Sword and shield pokemon currently have broken/missing descriptions, this code is mostly to avoid them.
        if (desc.length) {
            if (desc.children !== undefined || desc.children.length === 0) {
                if (desc[0].children[0] !== undefined) {
                    return desc[0].children[0].nodeValue;
                }
            }
        } else {
            return '';
        }
    },

    logResponse(pokemon, url) {
        console.log(`Index: ${ pokemon.index }, ${ pokemon.name }, ${ `${url}/wiki/${pokemon.name}` }, ${ pokemon.generation }`);
        console.log(pokemon.images[1]);
        console.log(pokemon.elementType);
        console.log(`Weight: ${pokemon.weight}, height: ${pokemon.height}`);
        console.log(`Moves: ${pokemon.moves.length}`);
        console.log(pokemon.description);
        console.log('-----------------------');
    }

};

module.exports = PageFilter;
