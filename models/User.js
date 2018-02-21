const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true 
  }
});

// add password fields by using passportLocalMongoose plugin
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
// use mongodbErrorHandler to give the user nice errors for uniqueness
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);