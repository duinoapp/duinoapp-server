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

  _autoUpdate: async (socket) => {
    if (!socket.coresAutoUpdated) {
      await cores.indexUpdate(socket);
      // eslint-disable-next-line no-param-reassign
      socket.coresAutoUpdated = true;
    }
  },

  // returns the indexes of cores used.
  indexList: async (socket, done) => {
    const config = await cores.readConfig(socket);
    const res = _.get(config, indPath) || [];
    if (done) done(res);
    return res;
  },

  // Updates the index of cores.
  indexUpdate: async (socket, done) => {
    await cli('core.update-index', [], socket);
    if (done) done();
  },

  // adds new core indexes
  indexNew: async (indexes, socket, done) => {
    const config = await cores.readConfig(socket);
    const existing = _.get(config, indPath) || [];
    await cores.writeConfig(_.set(config, indPath, _.uniq([...existing, ...indexes])));
    await cores.indexUpdate(socket, done);
  },

  // Search for a core in the package index.
  search: async (searchTerm = '', socket, done) => {
    await cores._autoUpdate(socket);
    const res = await cli('core.search', [searchTerm], socket, { emit: false });
    const response = res ? JSON.parse(res) : [];
    if (done) done(response);
    return response;
  },

  // Shows the list of installed platforms.
  list: async (socket, done) => {
    await cores._autoUpdate(socket);
    const res = await cli('core.list', [], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  // Installs one or more cores and corresponding tool dependencies.
  install: async (coreIds, socket, done) => {
    await cores._autoUpdate(socket);
    await cli('core.install', coreIds, socket);
    cores.list(socket, done);
  },
};

export default cores;
