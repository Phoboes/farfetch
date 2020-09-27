// pokemonController.js// Import pokemon model
const Pokemon = require('../models/pokemonModel');

// Handle index actions
exports.index = function (req, res) {
    Pokemon.get(function (err, pokemon) {
        if (err) {
            res.json({
                status: "error",
                message: err,
            });
        }
        res.json({
            status: "success",
            message: "Pokemon retrieved successfully",
            data: pokemon
        });
    });
};

exports.new = function (req, res) {
    var pokemon = new Pokemon();
    pokemon.name = req.body.name ? req.body.name : pokemon.name;
    pokemon.index = req.body.index;
    pokemon.generation = req.body.generation;
    pokemon.height = req.body.height;
    pokemon.weight = req.body.weight;
    pokemon.elementType = req.body.elementType;
    // pokemon.images = req.body.images;
    pokemon.moves = req.body.moves;
    pokemon.description = req.body.description;

    // save the pokemon and check for errors
    pokemon.save(function (err) {
        if (err)
            res.json(err);res.json({
            message: 'New pokemon created!',
            data: pokemon
        });
    });
};

// Handle view pokemon info
exports.view = function (req, res) {
    // If it's a number, assume it's a poke index, if not, assume it's a name
    if( parseInt(req.params.pokemon_id) ){
        Pokemon.find({
            index: req.params.pokemon_id
        }, function (err, pokemon) {
            if (err) {
                res.send(err);
            } else {
                res.json({
                    message: 'pokemon details loading..',
                    data: pokemon
                });
            }
        });
    } else {
        // Names are formatted, ensure the query matches the format for matching:
        const name = req.params.pokemon_id.charAt(0).toUpperCase() + req.params.pokemon_id.slice(1).toLowerCase();
         Pokemon.find({ name: name }, function (err, pokemon) {
             if (err) {
                 res.send(err);
             } else {
                 res.json({
                     message: 'pokemon details loading..',
                     data: pokemon
                 });
             }
         });
    }
};

// Handle update pokemon info
exports.update = function (req, res) {Pokemon.findById(req.params.pokemon_id, function (err, pokemon) {
        if (err)
        res.send(err);

        pokemon.name = req.body.name ? req.body.name : pokemon.name;
        pokemon.index = req.body.index;
        pokemon.generation = req.body.generation;
        pokemon.height = req.body.height;
        pokemon.weight = req.body.weight;
        pokemon.elementType = req.body.elementType;
        // pokemon.images = req.body.images;
        pokemon.moves = req.body.moves;
        pokemon.description = req.body.description;

        // save the pokemon and check for errors
        pokemon.save(function (err) {
            if (err)
                res.json(err);
            res.json({
                message: 'pokemon Info updated',
                data: pokemon
            });
        });
    });
};

// Handle delete pokemon
exports.delete = function (req, res) {
    Pokemon.remove({
        _id: req.params.pokemon_id
    }, function (err, pokemon) {
        if (err)
            res.send(err);res.json({
            status: "success",
            message: 'pokemon deleted'
        });
    });
};
