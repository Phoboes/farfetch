const $ = require('cheerio');
const PageFilter = {

    getMetric: function(html){
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
            //  lbs to kg
            // debugger
            parsedVals[0] = (parseFloat((imperials[0].children[0].data)) * 0.453592.toFixed(2) + ' kg');
            // ft/in to m
            const splitText = imperials[1].children[0].data.split("'");
            const inches = (parseInt(splitText[0]) * 12) + parseInt(splitText[1]);
            parsedVals[1] = (inches / 39.37).toFixed(2);
        }
        return {
            weight: parsedVals[0],
            height: parsedVals[1]
        };
    },

    getThisPokemonCard: function(html, pokemon){
        const cardList = $('.pi-section-navigation li div', html);
        // debugger
        if (cardList.length > 0) {
            for (let i = 0; i < cardList.length; i++) {
                const currentCard = $('.pi-section-content', html)[i];
                // Certain pages have alternate names, like Ratata's card labelled as "Kantonian Form" -- check the title tag on the card as a failsafe
                console.log("<<MULTIPLE FORMS>>");
                //  TODO: Maybe kill off the card tag checker
                if (
                    cardList[i].children[0].data.trim() === pokemon.name ||
                    $('.pi-title', currentCard)[0].children[0].data.trim() === pokemon.name
                ) {
                    return currentCard;
                } else if ( i + 1 === cardList.length ){
                    return $('.pi-section-content', html)[0];
                }
            }
        } else {
            return html;
        }
    },

    getTypes: function(html){
        const typeList = $(".image[title*=' type']", html);
        const cleanedTypes = [];
        for (let i = 0; i < typeList.length; i++) {
            cleanedTypes.push(typeList[i].attribs.title.replace(" type", ""));
        }
        return cleanedTypes.length > 1 ? `${cleanedTypes[0]}/${cleanedTypes[1]}` : cleanedTypes[0];
    },

    getAbilities: function(html){
        const abilities = [];
        const abilityList = $("[title*=' Abilities']", html).parent().parent().children().find('a').not('sup a').not('h3 a');
        for (let i = 0; i < abilityList.length; i++) {
            // debugger
            abilities.push(abilityList[i].attribs.title);
        }
        return abilities;
    },

    getIndex: function(html){
        // debugger
        return parseInt($('div[data-source="ndex"]', html)[0].children[0].data);
    },

    getGen: function (html) {
        return $('[title^="Generation"]', html)[0].children[0].data;
    },

    getRes(input){
        console.log(input);
        return input;
    },

    getUrlData(urls){
        for (let i = 0; i < urls.length; i++) {
            if (urls[i].attribs.title !== undefined) {
                return urls[i];
            }
        }
    }

};

module.exports = PageFilter;