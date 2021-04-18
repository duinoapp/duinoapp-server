const axios = require('axios');
const fs = require('fs');
const AWS = require('aws-sdk');
const YAML = require('yaml');

const sls = YAML.parse(fs.readFileSync(`${__dirname}/../sls-config.yml`, 'utf-8'));

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: sls.custom.region,
});

const get = async (key, file) => {
  const { Body } = await s3.getObject({ Key: key, Bucket: sls.custom.s3LibCache }).promise();
  return fs.promises.writeFile(file, Body);
};

const has = async (key) => {
  try {
    const res = await s3.headObject({ Key: key, Bucket: sls.custom.s3LibCache }).promise();
    console.log(res);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const set = async (key, url) => {
  const res = await axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
    timeout: 10 * 1000,
  });
  await s3.putObject({
    Key: key,
    Bucket: sls.custom.s3LibCache,
    Body: Buffer.from(res.data, 'binary'),
  }).promise();
};

module.exports = { get, has, set };
