import { promises } from 'fs';
import YAML from 'yaml';
import _ from 'lodash';
import cli from './arduino-exec';

const fs = promises;
const indPath = 'library_manager.additional_urls';

const libs = {

  readConfig: async (socket) => {
    const configFile = await fs.readFile(`${socket.tmpDir.path}/arduino-cli.yaml`, 'utf-8');
    return YAML.parse(configFile);
  },

  writeConfig: async (config, socket) => {
    const configFile = YAML.stringify(config);
    await fs.readFile(`${socket.tmpDir.path}/arduino-cli.yaml`, configFile);
  },


  indexList: async (socket, done) => {
    const config = await libs.readConfig(socket);
    const response = _.get(config, indPath) || [];
    if (done) done(response);
    return response;
  },

  // Updates the libraries index.
  indexUpdate: async (socket, done) => {
    await cli('lib.update-index', [], socket);
    if (done) done();
  },

  indexNew: async (indexes, socket, done) => {
    const config = await libs.readConfig(socket);
    const existing = _.get(config, indPath) || [];
    await libs.writeConfig(_.set(config, indPath, _.uniq([...existing, ...indexes])));
    await libs.indexUpdate(socket, done);
  },

  // Searchs for one or more libraries data.
  search: async (searchTerm = '', socket, done) => {
    const res = await cli('lib.search', [searchTerm], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  // Shows a list of all installed libraries.
  list: async (socket, done) => {
    const res = await cli('lib.list', [], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  // Installs one of more specified libraries into the system.
  install: async (libIds, socket, done) => {
    if (!socket.libsAutoUpdated) {
      await libs.indexUpdate();
      // eslint-disable-next-line no-param-reassign
      socket.libsAutoUpdated = true;
    }
    await cli('lib.install', libIds, socket);
    libs.list(socket, done);
  },

};

export default libs;
