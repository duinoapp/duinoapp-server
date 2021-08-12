const json = require('../utils/json');

const loadCores = () => json.parse('/mnt/duino-data/cores-processed.json');
const loadLibs = () => json.loadLargeData('libs');
const loadBoards = () => json.loadLargeData('boards');
const loadLegacyBoards = () => json.parse('/mnt/duino-data/legacy-boards-processed.json');

const searchRegex = (search = '') => new RegExp(`(${search.replace(/[^\w-\s]/g, '.').split(/\s+/g).join(')|(')})`, 'i');
const exactSearchRegex = (search = '') => new RegExp(`^${search.replace(/[^\w-\s]/g, '.?')}$`, 'i');

module.exports.server = (socket, done) => done && done({
  name: process.env.SERVER_INFO_NAME || 'Test Compile Server',
  location: process.env.SERVER_INFO_LOCATION || 'Unknown',
  country: process.env.SERVER_INFO_COUNTRY || 'AU',
  owner: process.env.SERVER_INFO_OWNER || 'Jane Smith',
  website: process.env.SERVER_INFO_WEBSITE || '',
  description: process.env.SERVER_INFO_DESCRIPTION || '',
});


module.exports.librariesSearch = async (data, socket, done) => {
  const libs = await loadLibs();
  const limit = Math.min(Math.max(data.limit || 10, 1), 100);
  const skip = Math.max(data.skip || 0, 0);
  const reg = searchRegex(data.search);
  const { sortBy = 'name' } = data;
  const sortDesc = !(typeof data.sortDesc === 'undefined' || `${data.sortDesc}` === 'false');
  const exact = !(typeof data.exact === 'undefined' || `${data.exact}` === 'false');
  const eq = (a, b) => a.toLowerCase() === b.toLowerCase();
  let res;
  if (exact) {
    const nameRegs = data.search.split(/\s*,\s*/g).map(exactSearchRegex);
    res = libs.filter((lib) => nameRegs.some((nr) => nr.test(lib.name)));
  } else {
    res = [
      ...libs.filter((lib) => eq(lib.name, data.search)),
      ...libs.filter((lib) => !eq(lib.name, data.search) && reg.test(lib.name))
        .sort((a, b) => {
          const ai = `${a[sortBy]}`.toLowerCase();
          const bi = `${b[sortBy]}`.toLowerCase();
          if (ai === bi) return 0;
          return (ai < bi ? -1 : 1) * (sortDesc ? -1 : 1);
        }),
    ];
  }
  const response = {
    limit, skip, total: res.length, data: res.slice(skip * limit, (skip + 1) * limit),
  };
  if (done) done(response);
  return response;
};

module.exports.libraries = async (socket, done) => done && done(await loadLibs());

module.exports.cores = async (socket, done) => done && done(await loadCores());

module.exports.boards = async (socket, done) => done && done(await loadBoards());

module.exports.legacyBoards = async (socket, done) => done && done(await loadLegacyBoards());
