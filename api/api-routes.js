// api-routes.js// Initialize express router
let router = require('express').Router();// Set default API response
router.get('/', function (req, res) {
    res.json({
        status: 'success',
        message: "Faaaaarrrrrfetch'd",
    });
});

// Import pokemon controller
var pokemonController = require('../controllers/pokemonController');
// Pokemon routes
router.route('/pokemon')
    .get(pokemonController.index)
    .post(pokemonController.new);
    
    router.route('/pokemon/:pokemon_id')
    .get(pokemonController.view)
    .patch(pokemonController.update)
    .put(pokemonController.update)
    .delete(pokemonController.delete);
    
// Export API routes
module.exports = router;