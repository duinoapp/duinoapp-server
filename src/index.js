require('dotenv').config();
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const info = require('./actions/info');
const program = require('./actions/program');
const { libPath } = require('./utils/files');
const downloadFile = require('./utils/download-file');

const app = express();
const server = http.Server(app);
const io = socketio(server);
server.listen(process.env.PORT || 3030);

app.options('*', cors());
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

io.on('connection', async (socket) => {
  socket.on('info.server', (done) => info.server(socket, done));
  socket.on('info.cores', (done) => info.cores(socket, done));
  socket.on('info.libraries', (done) => info.libraries(socket, done));
  socket.on('info.librariesSearch', (data, done) => info.librariesSearch(data, socket, done));
  socket.on('info.boards', (done) => info.boards(socket, done));

  socket.on('compile.start', (data, done) => program.compile(data, socket, done));
  socket.on('upload.start', (data, done) => program.upload(data, socket, done));

  socket.on('disconnect', () => socket.tmpDir && socket.tmpDir.cleanup());

  socket.emit('ready');
});

io.of('/ping').on('connect', (socket) => {
  socket.on('p', (done) => info.server(socket, done));
});

app.set('trust proxy', 1); // trust first proxy

app.get('/version', (req, res) => res.json({ version: '0.0.1', program: 'chromeduino' }));

app.get('/boards', (req, res) => info.legacyBoards(null, (data) => res.json(data)));

app.get('/libraries', (req, res) => info.libraries(null, (data) => res.json(data)));

app.post('/compile', async (req, res) => {
  if (typeof req.body.sketch !== 'string' || typeof req.body.board !== 'string') {
    res.json({ success: false, msg: 'invalid parameters passed' });
  } else {
    res.json(await program.legacyCompile({ fqbn: req.body.board, content: req.body.sketch }));
  }
});

app.post('/v3/compile', (req, res) => {
  const socket = {};
  program.compile(req.body, socket, (data) => {
    res.json(data);
    if (socket.tmpDir) socket.tmpDir.cleanup();
  });
});
app.get('/v3/info/server', (req, res) => {
  info.server(null, (data) => res.json(data));
});
app.get('/v3/info/cores', (req, res) => {
  info.cores(null, (data) => res.json(data));
});
app.get('/v3/info/boards', (req, res) => {
  info.boards(null, (data) => res.json(data));
});
app.get('/v3/info/libraries', (req, res) => {
  info.librariesSearch(req.query, null, (data) => res.json(data));
});
app.post('/v3/libraries/cache', (req, res) => {
  const { libs } = req.body;
  Promise.all(libs.map(async (lib) => {
    const filePath = libPath(lib.url);
    await downloadFile(lib.url, filePath, null, null, true);
  })).then(() => res.status(204).send());
});

console.log(`🚀 Server Launched on http://localhost:${process.env.PORT || 3030}`);
module.exports = app;
