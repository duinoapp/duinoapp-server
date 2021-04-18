const s3 = require('./s3');
const lambda = require('./lambda');
const { libPath } = require('../src/utils/files');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

module.exports.cache = async (e) => {
  if (e.source === 'aws.events') return Promise.resolve({ statusCode: 204 });
  const { libs } = typeof e.body === 'string' ? JSON.parse(e.body) : e.body;
  const newLibs = [];
  console.log(libs);

  await Promise.all(libs.map(async (lib) => {
    const path = libPath(lib.url);
    const key = path.split('/').pop();
    if (await s3.has(key)) return;
    await s3.set(key, lib.url);
    newLibs.push(lib);
  }));
  console.log(newLibs);

  if (newLibs.length) {
    await lambda.invoke('save-libs', { libs: newLibs });
  }

  return { statusCode: 204, headers };
};

module.exports.save = async (e) => {
  const { libs } = e;
  console.log(libs);

  await Promise.all(libs.map(async (lib) => {
    const path = libPath(lib.url);
    const key = path.split('/').pop();
    await s3.get(key, path);
  }));

  return { statusCode: 204, headers };
};
