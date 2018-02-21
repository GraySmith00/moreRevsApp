const passport = require('passport');

// choosing a login strategy from passportjs
// first argument is the strategy, second is a config object
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Login failed',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out, c yuh!');
  res.redirect('/');
}