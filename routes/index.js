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
router.post('/add', 
  storeController.upload, 
  catchErrors(storeController.resize), 
  catchErrors(storeController.createStore)
);

// STORECONTROLLER SHOW PAGE
// ==================================================
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

// STORECONTROLLER EDIT PAGE
// ==================================================
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

// STORECONTROLLER UPDATE ACTION
// ==================================================
router.post('/add/:id', 
  storeController.upload, 
  catchErrors(storeController.resize), 
  catchErrors(storeController.updateStore)
);

// ALL TAGS PAGE
// ==================================================
router.get('/tags', catchErrors(storeController.getStoresByTag));

// ALL STORES WITH ONE CERTAIN TAG PAGE
// ==================================================
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));


// EXPORT ROUTER
// ==================================================
module.exports = router;

