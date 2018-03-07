// STORE CONTROLLER
// ==================================================
const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');

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
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

// INDEX ACTION
// ==================================================
exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4
  // skipping over the items on previous pages
  const skip = (page * limit) - limit;
  
  // 1. Query the database for a list of all stores
  const storesPromise = Store
                        .find()
                        .skip(skip)
                        .limit(limit)
                        .sort({ created: 'desc' });
                        
  const countPromise = Store.count();
  
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  
  const pages = Math.ceil(count / limit);
  
  // in case someone tries to skip to a page that doesn't exist in the url
  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}, but that doesn't exist!`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render('stores', { title: 'Stores', stores: stores, page, pages, count });
};

// SHOW ACTION
// ==================================================
exports.getStoreBySlug = async (req, res) => {
  const store = await Store
                        .findOne({ slug: req.params.slug })
                        .populate('author reviews');
  if (!store) {
    return next();
  }
  res.render('store', { store });
};

// CONFIRM OWNER FUNCTION
// ==================================================
const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You can only edit your own stores!');
  }
};

// EDIT PAGE
// ==================================================
exports.editStore = async (req, res) => {
  // 1. Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm user is logged in and the owner of the store
  confirmOwner(store, req.user);
  // 3. Render Edit form so user can edit store
  res.render('editStore', { title: `Edit ${store.name}`, store: store });
};

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
};

// TAGS PAGE
// ==================================================
exports.getStoresByTag = async (req, res) => {
  // gets individual tag from the url
  const tag = req.params.tag; 
  // determines whether all stores should be displayed or filtered by the tag in the url
  const tagQuery = tag || { $exists: true }
  // gets the tags from the stores and their count, see getTagsList method in Store.js model
  const tagsPromise = Store.getTagsList();
  // finds the stores that include an individual tag
  const storesPromise = Store.find({ tags: tagQuery });
  
  // await both promises at once so they can happen asynchronously
  // result [tags, stores] lists each tag w its count, and each store that includes the selected tag
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  
  // res.json(tags);
  //res.json([tags, stores]);
  res.render('tag', { tags, title: 'Tags', tag, stores });
};

// MAP PAGE
// ==================================================
exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

// TOP STORES PAGE
// ==================================================
exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  //res.json(stores);
  res.render('topStores', { stores, title: '⭐ Top Stores!' })
};






// SEARCH STORES API ENDPOINT 
// ==================================================
exports.searchStores = async (req, res) => {
  const stores = await Store
  // first find stores that contain search criteria
  .find({
    // mongodb text operator will perform search on any fields with a 'text' index type
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // sore stores by their metaData textScore
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to 10 results
  .limit(10);
  
  // return json of search results
  res.json(stores);
};

// MAP STORES API ENDPOINT
// ==================================================
exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      // near is a special operator in mongodb
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };
  const stores = await Store
                        .find(q)
                        .select('slug name description location photo')
                        .limit(10);
  res.json(stores);
};

// HEART STORE POST TO API
// ==================================================
exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; // addToSet is like push, but makes sure its not adding a duplicate
  const user = await User
                      // finds the current user
                      .findByIdAndUpdate(req.user._id,
                      // either deletes or adds store object id to hearts array depending on whether it was there before
                        { [operator]: { hearts: req.params.id } },
                      // returns newly updated user
                        { new: true }
                      );
  res.json(user);
};

// GET HEARTS
// ==================================================
exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  
  res.render('stores', { title: 'Hearted Stores', stores })
};