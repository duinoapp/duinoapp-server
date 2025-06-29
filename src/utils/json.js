const fs = require('fs');
const { Type } = require('js-binary');
const _ = require('lodash');

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
    archive_filename: 'string',
    checksum: 'string',
    size: 'uint',
    cache_path: 'string',
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
  properties_id: 'string',
  package: {
    maintainer: 'string',
    url: 'string',
    website_url: 'string',
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
    archive_filename: 'string',
    checksum: 'string',
    size: 'uint',
    name: 'string',
  },
  'official?': 'boolean',
  'properties?': 'json',
  'identification_properties?': [
    {
      properties: {
        'vid?': 'string',
        'pid?': 'string',
        'board?': 'string',
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
    return {
      file: '/mnt/duino-data/libs-processed.jsbin',
      schema: libSchema,
      keepFields: [
        'name', 'author', 'version', 'maintainer', 'sentence',
        'website', 'category', 'types', 'resources', 'urls',
        'paragraph', 'dependencies', 'architectures',
      ],
    };
  case 'boards':
    return {
      file: '/mnt/duino-data/boards-processed.jsbin',
      schema: boardSchema,
      keepFields: [
        'fqbn', 'name', 'version', 'properties_id', 'package',
        'platform', 'official', 'properties', 'identification_properties',
        'config_options',
      ],
    };
  default:
    throw new Error('Unknown type');
  }
};

const saveLargeData = async (type, data) => {
  const { file, schema } = getProps(type);
  await fs.promises.writeFile(file, schema.encode(data));
};

const saveDataAsJSONL = async (type, data) => {
  const { file, keepFields } = getProps(type);
  const stream = fs.createWriteStream(file.replace('.jsbin', '.jsonl'));
  const asyncWrite = (datum) => new Promise((resolve) => stream.write(datum, resolve));
  await data.reduce(async (prev, datum) => {
    await prev;
    return asyncWrite(`${JSON.stringify(_.pick(datum, keepFields))}\n`);
  }, Promise.resolve());
  return new Promise((resolve) => stream.end(resolve));
};

const loadLargeData = async (type) => {
  const { file, schema } = getProps(type);
  if (parseCache[file]) return parseCache[file];
  const res = schema.decode(await fs.promises.readFile(file));
  parseCache[file] = res;
  return res;
};

module.exports = {
  parse, stringify, saveLargeData, loadLargeData, saveDataAsJSONL,
};
