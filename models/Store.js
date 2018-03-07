const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true,
    required: 'Please include a description!'
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates'
    }],
    address: {
      type: String,
      required: 'You must supply an address~'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author.'
  }
}, {
  // brings the data from the virtuals into the store object without having to explicitly call it
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES
//==================================================
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({
  location: '2dsphere'
})

// SETTING THE SLUG BEFORE SAVING THE STORE
//==================================================
storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  
  // make sure new slug is unique
  // find other stores that have the same slug eg. bar, bar-1, bar-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i'); // i stands for case insensitive
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  
  // if this slug already exists, add a -number onto the end of it
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  
  next();
});

// ADD A STATIC METHOD ONTO THE SCHEMA FOR TAGS
//==================================================
storeSchema.statics.getTagsList = function() {
  // aggregate is a built in method that takes an array of possible operators that were looking for
  return this.aggregate([
    { $unwind: '$tags' }, // unwind seperates out each tag associated with a store
    { $group: { _id: '$tags', count: { $sum: 1 } } }, // group adds each instance of a tag to that tags count
    { $sort: { count: -1 } } // sorts by which tags have the highest count
  ]); 
}

// GET TOP STORES METHOD
//==================================================
storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // look up stores and populate their reviews
    { $lookup: {
        from: 'reviews', 
        localField: '_id', 
        foreignField: 'store', 
        as: 'reviews'
      } 
    },
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // add the average reviews field
    // create a new field called average rating, set it to be the average of reviews.rating field
    { $addFields: { // use $project if below mongodb 3.4
      // photo: '$$ROOT.photo',
      // name: '$$ROOT.name',
      // reviews: '$$ROOT.reviews',
      averageRating: { $avg: '$reviews.rating'} // $ means that its a field from the data being piped in from the match
    } },
    // sort it by average reviews field, highest review average first
    { $sort: { averageRating: -1 } },
    // limit to 10 top stores
    { $limit: 10 }
  ]);
};

// VIRTUAL POPULATE - ADD REVIEWS FIELD TO SCHEMA
//==================================================
// find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
  // what model are we linking?
  ref: 'Review',
  // which field on our store needs to match up with the field on our foreign model, reviews are saving store id
  localField: '_id',
  // which field on the foreign model matches up with the store
  foreignField: 'store'
});

// MODULE.EXPORTS STORE MODEL
//==================================================
module.exports = mongoose.model('Store', storeSchema);