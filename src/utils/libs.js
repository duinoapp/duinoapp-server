import { promises } from 'fs';
import YAML from 'yaml';
import _ from 'lodash';
import cli from './arduino-exec';

const fs = promises;
const indPath = 'library_manager.additional_urls';

const readConfig = async (socket) => {
  const configFile = await fs.readFile(`${socket.tmpDir.path}/arduino-cli.yaml`, 'utf-8');
  return YAML.parse(configFile);
};

const writeConfig = async (config, socket) => {
  const configFile = YAML.stringify(config);
  await fs.readFile(`${socket.tmpDir.path}/arduino-cli.yaml`, configFile);
};


export const indexList = async (socket, done) => {
  const config = await readConfig(socket);
  if (done) done(_.get(config, indPath) || []);
};

export const indexUpdate = async (socket, done) => {
  await cli('lib.update-index', [], socket);
  if (done) done();
};

export const indexNew = async (indexes, socket, done) => {
  const config = await readConfig(socket);
  const existing = _.get(config, indPath) || [];
  await writeConfig(_.set(config, indPath, _.uniq([...existing, ...indexes])));
  await indexUpdate(socket, done);
};

export const search = async (searchTerm = '', socket, done) => {
  const res = await cli('lib.search', [searchTerm], socket, { emit: false });
  if (done) done(JSON.stringify(res));
};

export const list = async (socket, done) => {
  const res = await cli('lib.list', [], socket, { emit: false });
  if (done) done(JSON.stringify(res));
};

export const install = async (libIds, socket, done) => {
  await cli('lib.install', libIds, socket);
  list(socket, done);
};
