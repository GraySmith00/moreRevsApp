// STORE CONTROLLER
// ==================================================
const mongoose = require('mongoose');
const Store = mongoose.model('Store');

// NEW ACTION
// ==================================================
exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

// CREATE ACTION
// ==================================================
exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

// INDEX ACTION
// ==================================================
exports.getStores = async (req, res) => {
  // 1. Query the database for a list of all stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores: stores });
}

// EDIT PAGE
// ==================================================
exports.editStore = async (req, res) => {
  // 1. Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  
  // 2. Confirm user is logged in and the owner of the store
  
  // 3. Render Edit form so user can edit store
  res.render('editStore', { title: `Edit ${store.name}`, store: store });
}

// EDIT PAGE
// ==================================================
exports.updateStore = async (req, res) => {
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the newly updated store instead of old one
    runValidators: true, // force model to run validators again
  }).exec(); // runs the query
  
  // 2. Redirect to store page and flash success
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
}