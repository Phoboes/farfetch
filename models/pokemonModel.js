// pokemonModel.js

var mongoose = require('mongoose');

// Setup schema
var pokemonSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    index: {
        type: Number,
        required: true
    },
    generation: {
        type: String
    },
    elementType: {
        type: String
    },
    height: {
        type: String
    },
    weight: {
        type: String
    },
    // images: {
    //     type: Schema.Types.ObjectId, ref: 'Image'
    // },
    images: {
        type: Array
    },
    moves: {
        type: Array
    },
    description: {
        type: String
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});

// Export pokemon model
var Pokemon = module.exports = mongoose.model('pokemon', pokemonSchema);module.exports.get = function (callback, limit) {
    Pokemon.find(callback).limit(limit);
}