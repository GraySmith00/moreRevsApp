// ROUTES
// ==================================================
const express = require('express');
const router = express.Router();

// REQUIRE CONTROLLERS
// ==================================================
const storeController = require('../controllers/storeController');

// CATCH ERROR WRAPPER
// ==================================================
const { catchErrors } = require('../handlers/errorHandlers.js');

// STORECONTROLLER HOMEPAGE / INDEX ACTION
// ==================================================
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));

// STORECONTROLLER NEW PAGE
// ==================================================
router.get('/add', storeController.addStore);

// STORECONTROLLER CREATE ACTION
// ==================================================
router.post('/add', catchErrors(storeController.createStore));

// STORECONTROLLER EDIT PAGE
// ==================================================
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

// STORECONTROLLER UPDATE ACTION
// ==================================================
router.post('/add/:id', catchErrors(storeController.updateStore));





module.exports = router;

