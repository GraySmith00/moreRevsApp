// USER CONTROLLER
// ==================================================
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');


// LOG IN FORM PAGE
// ==================================================
exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

// REGISTER FORM PAGE
// ==================================================
exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

// USER CREATE ACTION
// ==================================================
exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  
  // .register method comes from passportLocalMongoose library
  // lowercase user is the instance, uppercase User is the model
  // .register doesn't return a promise so you have to use a callback or use the promisify library to turn it into a promise
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // pass to authController.login
}










// REGISTRATION DATA VALIDATOR MIDDLEWARE
// ==================================================
exports.validateRegister = (req, res, next) => {
  // sanitizeBody and other methods come from expressValidator library required and used in app.js
  // https://github.com/ctavan/express-validator
  // https://github.com/chriso/validator.js
  req.sanitizeBody('name'); 
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false 
  });
  req.checkBody('password', 'Password Cannot be Blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);
  
  const errors = req.validationErrors();
  if (errors) {
    // message the errors to the user
    req.flash('error', errors.map(err => err.msg));
    // re-render the form without completely clearing it
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() })
    return; // stop the function from running
  }
  next();
};

