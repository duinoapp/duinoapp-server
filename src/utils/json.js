const fs = require('fs');
const { Type } = require('js-binary');

const parseCache = {};

const parse = async (file) => {
  if (parseCache[file]) return parseCache[file];
  const res = JSON.parse(await fs.promises.readFile(file, 'utf-8'));
  parseCache[file] = res;
  return res;
};
const stringify = (file, body) => fs.promises.writeFile(file, JSON.stringify(body));

const libSchema = new Type([{
  name: 'string',
  author: 'string',
  version: 'string',
  maintainer: 'string',
  sentence: 'string',
  website: 'string',
  category: 'string',
  types: ['string'],
  resources: {
    url: 'string',
    archivefilename: 'string',
    checksum: 'string',
    size: 'uint',
    cachepath: 'string',
  },
  urls: [{ version: 'string', url: 'string' }],
  'paragraph?': 'string',
  'dependencies?': [{ name: 'string' }],
  'architectures?': ['string'],
}]);


const boardSchema = new Type([{
  fqbn: 'string',
  name: 'string',
  version: 'string',
  propertiesId: 'string',
  package: {
    maintainer: 'string',
    url: 'string',
    websiteURL: 'string',
    name: 'string',
    help: {
      online: 'string',
    },
    'email?': 'string',
  },
  platform: {
    architecture: 'string',
    category: 'string',
    url: 'string',
    archiveFileName: 'string',
    checksum: 'string',
    size: 'uint',
    name: 'string',
  },
  'official?': 'boolean',
  'properties?': 'json',
  'identification_pref?': [
    {
      usbID: {
        VID: 'string',
        PID: 'string',
      },
    },
  ],
  'config_options?': [
    {
      option: 'string',
      values: [
        {
          value: 'string',
          'value_label?': 'string',
          'selected?': 'boolean',
        },
      ],
      'option_label?': 'string',
    },
  ],
}]);

const getProps = (type) => {
  switch (type) {
  case 'libs':
    return { file: '/mnt/duino-data/libs-processed.jsbin', schema: libSchema };
  case 'boards':
    return { file: '/mnt/duino-data/boards-processed.jsbin', schema: boardSchema };
  default:
    throw new Error('Unknown type');
  }
};

const saveLargeData = async (type, data) => {
  const { file, schema } = getProps(type);
  await fs.promises.writeFile(file, schema.encode(data));
};

const loadLargeData = async (type) => {
  const { file, schema } = getProps(type);
  if (parseCache[file]) return parseCache[file];
  const res = schema.decode(await fs.promises.readFile(file));
  parseCache[file] = res;
  return res;
};

module.exports = {
  parse, stringify, saveLargeData, loadLargeData,
};
