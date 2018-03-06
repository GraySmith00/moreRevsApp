// USER MODEL 
// ==================================================
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise; 
const md5 = require('md5'); // hashes user's email address for use with gravatar
const validator = require('validator'); // easy data validation
const mongodbErrorHandler = require('mongoose-mongodb-errors'); // clean errors for email uniqueness
const passportLocalMongoose = require('passport-local-mongoose'); // authentication

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
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [
    { type: mongoose.Schema.ObjectId, ref: 'Store' }  
  ]
});

// add virtual field for user gravatar
userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

// add password fields by using passportLocalMongoose plugin
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
// use mongodbErrorHandler to give the user nice errors for uniqueness
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);