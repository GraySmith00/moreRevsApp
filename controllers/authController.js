// AUTH CONTROLLER
// ==================================================
const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

// LOGIN 
// ==================================================
// choosing a login strategy from passportjs
// first argument is the strategy, second is a config object
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Login failed',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

// LOGOUT
// ==================================================
exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out, c yuh!');
  res.redirect('/');
};

// FORGOT PASSWORD SUBMIT
// =================================================
exports.forgot = async (req, res) => {
  // 1. See if a user with that email exists
  const user = await User.findOne({ email: req.body.email });
  if(!user) {
    req.flash('error', 'There is no account associated with that email address.');
    return res.redirect('/login');
  }
  // 2. Set reset tokens and expire time on the token
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hr from now
  await user.save();
  // 3. Send user an email with the reset token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user: user, 
    subject: 'Password Reset',
    resetURL: resetURL,
    filename: 'password-reset',
  });
  req.flash('success', `You have been emailed a password reset link.`);
  // 4. Redirect to the login page 
  res.redirect('/login');
};

// FORGOT PASSWORD RESET LINK PAGE
// =================================================
exports.reset = async (req, res) => {
  // find the user by the reset token param
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // $gt means greater than
  });
  // if there is no user associated with the token, flash error and redirect
  if(!user) {
    req.flash('error', 'Password reset is invalid or has expired.');
    return res.redirect('/login');
  }
  // if there is a user, show the password form
  res.render('reset', { title: 'Reset your password'});
};

// RESET PASSWORD UPDATE ACTION
// ==================================================
exports.update = async (req, res) => {
  // find the user
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  // check to make sure the user exists
  if(!user) {
    req.flash('error', 'Password reset is invalid or has expired.');
    return res.redirect('/login');
  }
  // use setPassword method and make it so it can return a promise using promisify
  const setPassword = promisify(user.setPassword, user); // passport method that needs to be made to return a promise
  // setPassword to req.body.password
  await setPassword(req.body.password);
  // get rid of resetPasswordToken and resetPasswordExpires fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // create updated user
  const updatedUser = await user.save();
  // login the updated user
  await req.login(updatedUser);
  req.flash('success', 'Your password has been updated! You are now logged in!');
  res.redirect('/');
};




// MIDDLEWARE TO CHECK IF USER IS LOGGED IN
// ==================================================
exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated, .isAuthenticated method comes with passport
  if(req.isAuthenticated()) {
    return next(); // user is authenticated, carry on!
  }
  req.flash('error', 'Oops! You gotta be logged in to do that dawgy!');
  res.redirect('/login');
};

// MIDDLEWARE TO CHECK IF PASSWORD AND CONFIRM PASSWORD ARE THE SAME
// ==================================================================
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {  // you have to use square bracket notation on properties that have dashes
    return next(); // passwords match carry on
  }  
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};