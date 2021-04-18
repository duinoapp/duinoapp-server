const fs = require('fs');
const AWS = require('aws-sdk');
const YAML = require('yaml');

const sls = YAML.parse(fs.readFileSync(`${__dirname}/../sls-config.yml`, 'utf-8'));

const lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
  region: sls.custom.region,
});

const invoke = async (ref, payload) => {
  await lambda.invoke({
    FunctionName: `duinoapp-server-${sls.custom.stage}-${ref}`,
    Payload: JSON.stringify(payload),
  }).promise();
};

module.exports = { invoke };
