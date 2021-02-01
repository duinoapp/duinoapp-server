const fs = require('fs');
const properties = require('properties');
/* eslint-disable import/no-unresolved */
const cores = require('../../data/cores.json');
const libs = require('../../data/libs.json');
const boards = require('../../data/boards.json');

const searchRegex = (search = '') => new RegExp(`(${search.replace(/[^\w-\s]/g, '.').split(/\s+/g).join(')|(')})`, 'i');

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
  const path = `/home/duino/.arduino15/packages/${pack}/hardware/${arch}/${core.latest}/boards.txt`;
  let props;
  try {
    props = processFile(path);
  } catch (err) {
    if (!err.message.includes('no such file or directory')) throw err;
    props = processFile(path.replace('arduino-beta', 'arduino'));
  }
  processedBoards = processedBoards.map((board) => (!board.fqbn.includes(`${core.id}:`) ? board : {
    ...board,
    properties: props[board.fqbn.split(':')[2]],
  }));
});

const legacyBoards = {};
processedBoards
  .filter((board) => board.fqbn.includes('arduino:avr'))
  .forEach((board) => {
    const cpuOpt = board.config_options && board.config_options.find((opt) => opt.option === 'cpu');
    if (cpuOpt) {
      cpuOpt.values.forEach((cpuVal) => {
        legacyBoards[`${board.fqbn}:cpu=${cpuVal.value}`] = {
          name: `${board.name} / ${cpuVal.value_label}`,
          upload_speed: board.properties.upload.speed,
        };
      });
    } else {
      legacyBoards[board.fqbn] = {
        name: board.name,
        upload_speed: board.properties.upload.speed,
      };
    }
  });

module.exports.librariesSearch = (data, socket, done) => {
  if (!done) return;
  const limit = Math.min(Math.max(data.limit || 10, 1), 100);
  const skip = Math.max(data.skip || 0, 0);
  const reg = searchRegex(data.search);
  const { sortBy = 'name', sortDesc = false } = data;
  const res = processedLibs.filter((lib) => reg.test(lib.name)).sort((a, b) => {
    const ai = `${a[sortBy]}`.toLowerCase();
    const bi = `${b[sortBy]}`.toLowerCase();
    if (ai === bi) return 0;
    return (ai < bi ? -1 : 1) * (sortDesc ? -1 : 1);
  });
  done({
    limit, skip, total: res.length, data: res.slice(skip * limit, (skip + 1) * limit),
  });
};

module.exports.libraries = (socket, done) => done && done(processedLibs);

module.exports.cores = (socket, done) => done && done(processedCores);

module.exports.boards = (socket, done) => done && done(processedBoards);

module.exports.legacyBoards = legacyBoards;
