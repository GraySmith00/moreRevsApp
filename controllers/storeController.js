// STORE CONTROLLER
// ==================================================
const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer'); // enable multipart for image file upload
const jimp = require('jimp'); // resize photos
const uuid = require('uuid'); // unique identifier for when people upload images with the same file name

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: "That file type isn't supported."}, false);
    }
  }
}

// NEW ACTION
// ==================================================
exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

// PHOTO UPLOAD MIDDLEWARE
// ==================================================
exports.upload = multer(multerOptions).single('photo');

// PHOTO RESIZE MIDDLEWARE
// ==================================================
exports.resize = async (req, res, next) => {
  // check if there is a new file to resize
  if (!req.file) {
    next(); // no file, skip this function
    return;
  } 
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  
  // now we resize the photo
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  
  // once we have written the photo to our filesystem, keep going!
  next();
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
};

// SHOW ACTION
// ==================================================
exports.getStoreBySlug = async (req, res) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) {
    return next();
  }
  res.render('store', { store });
};

// EDIT PAGE
// ==================================================
exports.editStore = async (req, res) => {
  // 1. Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  
  // 2. Confirm user is logged in and the owner of the store
  
  // 3. Render Edit form so user can edit store
  res.render('editStore', { title: `Edit ${store.name}`, store: store });
}

// UPDATE ACTION
// ==================================================
exports.updateStore = async (req, res) => {
  // set the location data to be type of point
  req.body.location.type = 'Point';
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the newly updated store instead of old one
    runValidators: true, // force model to run validators again
  }).exec(); // runs the query
  
  // 2. Redirect to store page and flash success
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
}