/* eslint-disable import/first */
require('dotenv').config();

import fs from 'fs';
import socketio from 'socket.io';
import files from './utils/files';
import boards from './utils/boards';
import cores from './utils/cores';
import libs from './utils/libs';
import program from './utils/program';

const io = socketio(process.env.PORT || 3030);

const initFiles = [
  { name: 'arduino-cli.yaml', content: fs.readFileSync(`${__dirname}/bin/arduino-cli.yaml`) },
];

io.on('connection', async (socket) => {
  await files.loadTempFiles(initFiles, socket);
  await cores.indexUpdate(socket);
  await libs.indexUpdate(socket);

  socket.on('files.new', (fileObjects, done) => files.loadTempFiles(fileObjects, socket, 'files', done));
  socket.on('files.setSketch', (path, done) => files.setSketch(path, socket, 'files', done));

  // socket.on('core.index.new', (indexes, done) => cores.indexNew(indexes, socket, done));
  // socket.on('core.index.list', done => cores.indexList(socket, done));
  socket.on('core.index.update', done => cores.indexUpdate(socket, done));

  socket.on('core.search', (search, done) => cores.search(search, socket, done));
  socket.on('core.install', (coreIds, done) => cores.install(coreIds, socket, done));
  socket.on('core.list', done => cores.list(socket, done));

  socket.on('board.details', (search, done) => boards.details(search, socket, done));
  socket.on('board.listall', done => boards.listall(socket, done));
  socket.on('board.list', done => boards.list(socket, done));

  // socket.on('lib.index.new', (indexes, done) => libs.indexNew(indexes, socket, done));
  // socket.on('lib.index.list', done => libs.indexList(socket, done));
  socket.on('lib.index.update', done => libs.indexUpdate(socket, done));

  socket.on('lib.search', (search, done) => libs.search(search, socket, done));
  socket.on('lib.install', (libIds, done) => libs.install(libIds, socket, done));
  socket.on('lib.list', done => libs.list(socket, done));

  socket.on('compile.start', (data, done) => program.compile(data, socket, done));
  socket.on('upload.start', (data, done) => program.upload(data, socket, done));

  socket.on('disconnect', () => socket.tmpDir.cleanup());
});
