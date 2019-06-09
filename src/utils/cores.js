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
    const response = _.get(config, indPath) || [];
    if (done) done(response);
    return response;
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
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  list: async (socket, done) => {
    const res = await cli('cores.list', [], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  install: async (coreIds, socket, done) => {
    if (!socket.coresAutoUpdated) {
      await cores.indexUpdate();
      // eslint-disable-next-line no-param-reassign
      socket.coresAutoUpdated = true;
    }
    await cli('cores.install', coreIds, socket);
    cores.list(socket, done);
  },
};

export default cores;
