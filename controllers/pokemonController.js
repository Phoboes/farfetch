// pokemonController.js// Import pokemon model
Pokemon = require('../models/pokemonModel');

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

// Handle create pokemon actions

// Schema:
// Name
// Index
// Height
// Weight
// ElementTypes
// Images PENDING
// Moves
// Description

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
    Pokemon.findById(req.params.pokemon_id, function (err, pokemon) {
        if (err)
            res.send(err);
        res.json({
            message: 'pokemon details loading..',
            data: pokemon
        });
    });
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