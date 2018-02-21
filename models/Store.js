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
  photo: String
});


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


// MODULE.EXPORTS STORE MODEL
//==================================================
module.exports = mongoose.model('Store', storeSchema);