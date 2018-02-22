const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice'); //helps with inlining css
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// function to find the pug template, convert it to html, then return the html to use in the email
const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options); // renderFile is a pug method, __dirname is a special keyword that sets the directory to wherever this file is runing from
    const inlined = juice(html);
    return inlined;
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: `Jimbone <jimbone@example.com>`,
    to: options.user.email,
    subject: options.subject,
    html: html,
    text: text
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
}









// transport.sendMail({
//   from: 'Gray Savoy <gray.smith00@gmail.com>',
//   to: 'bob@example.com',
//   subject: 'Hey there partner',
//   html: 'Hey I <strong>love</strong> chicken sandwiches!',
//   text: 'Hey I love chicken sandwiches!'
// });