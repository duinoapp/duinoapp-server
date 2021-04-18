/* eslint-disable global-require */
require('dotenv').config();

module.exports = {
  install: (...args) => require('./install.js')(...args),
  server: (...args) => require('./server.js')(...args),
};
