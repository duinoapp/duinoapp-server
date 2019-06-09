import { promises } from 'fs';
import YAML from 'yaml';
import _ from 'lodash';
import cli from './arduino-exec';

const fs = promises;
const indPath = 'board_manager.additional_urls';

const cores = {

  readConfig: async (socket) => {
    const configFile = await fs.readFile(`${socket.tmpDir.path}/arduino-cli.yaml`, 'utf-8');
    return YAML.parse(configFile);
  },

  writeConfig: async (config, socket) => {
    const configFile = YAML.stringify(config);
    await fs.readFile(`${socket.tmpDir.path}/arduino-cli.yaml`, configFile);
  },


  indexList: async (socket, done) => {
    const config = await cores.readConfig(socket);
    if (done) done(_.get(config, indPath) || []);
  },

  indexUpdate: async (socket, done) => {
    await cli('cores.update-index', [], socket);
    if (done) done();
  },

  indexNew: async (indexes, socket, done) => {
    const config = await cores.readConfig(socket);
    const existing = _.get(config, indPath) || [];
    await cores.writeConfig(_.set(config, indPath, _.uniq([...existing, ...indexes])));
    await cores.indexUpdate(socket, done);
  },

  search: async (searchTerm = '', socket, done) => {
    const res = await cli('cores.search', [searchTerm], socket, { emit: false });
    if (done) done(JSON.stringify(res));
  },

  list: async (socket, done) => {
    const res = await cli('cores.list', [], socket, { emit: false });
    if (done) done(JSON.stringify(res));
  },

  install: async (coreIds, socket, done) => {
    await cli('cores.install', coreIds, socket);
    cores.list(socket, done);
  },
};

export default cores;
