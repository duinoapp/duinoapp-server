const serverless = require('serverless-http');
const app = require('../src/index');

module.exports = (event) => {
  console.log(event);
  if (event.source === 'aws.events') return Promise.resolve({ statusCode: 204 });
  console.log('server');
  return serverless(app)(event);
};
