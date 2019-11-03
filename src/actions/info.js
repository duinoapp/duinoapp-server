const fs = require('fs');
const properties = require('properties');
/* eslint-disable import/no-unresolved */
const cores = require('../../data/cores.json');
const libs = require('../../data/libs.json');
const boards = require('../../data/boards.json');

module.exports.server = (socket, done) => done && done({
  name: process.env.SERVER_INFO_NAME || 'Test Compile Server',
  location: process.env.SERVER_INFO_LOCATION || 'Unknown',
  country: process.env.SERVER_INFO_COUNTRY || 'AU',
  owner: process.env.SERVER_INFO_OWNER || 'Jane Smith',
  website: process.env.SERVER_INFO_WEBSITE || '',
  description: process.env.SERVER_INFO_DESCRIPTION || '',
});

const processFile = (path) => {
  let file = fs.readFileSync(path, 'utf8');
  // make boards.txt file compatible
  file = file.replace(/(\n\r)|(\n)|(\r)/g, '\n');
  file = file.split('\n').map((line) => {
    if (!line.includes('=')) return line;
    const key = line.replace(/=.*/, '');
    let newLine = line;
    if (!/\.upload\./.test(key)) newLine = '';
    return newLine;
  }).join('\n');
  return properties.parse(file, { namespaces: true });
};

const lowerCaseKeys = (obj) => Object.keys(obj).reduce((a, i) => {
  // eslint-disable-next-line no-param-reassign
  a[i.toLowerCase()] = obj[i];
  return a;
}, {});

const processedLibs = libs.libraries.map((lib) => ({
  name: lib.name,
  ...(lib.releases.latest || lib.releases[Object.keys(lib.releases).pop()]),
}));

const processedCores = cores.map(lowerCaseKeys);

let processedBoards = boards;
processedCores.forEach((core) => {
  const [pack, arch] = core.id.split(':');
  const path = `${__dirname}/../../data/arduino/packages/${pack}/hardware/${arch}/${core.latest}/boards.txt`;
  const props = processFile(path);
  processedBoards = processedBoards.map((board) => (!board.fqbn.includes(`${core.id}:`) ? board : {
    ...board,
    properties: props[board.fqbn.split(':')[2]],
  }));
});

module.exports.libraries = (socket, done) => done && done(processedLibs);

module.exports.cores = (socket, done) => done && done(processedCores);

module.exports.boards = (socket, done) => done && done(processedBoards);
