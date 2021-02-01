require('dotenv').config();
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const auth = require('http-auth');
const authConnect = require('http-auth-connect');
const StatusMonitor = require('express-status-monitor');

const info = require('./actions/info');
const program = require('./actions/program');

const app = express();
const server = http.Server(app);
const io = socketio(server);
server.listen(process.env.PORT || 3030);

if (process.env.MONITOR_LOGIN) {
  const statusMonitor = StatusMonitor({ path: '', websocket: io });
  const basic = auth.basic({ realm: 'Monitor Area' }, (user, pass, callback) => {
    const [adminUser, adminPass] = process.env.MONITOR_LOGIN.split(':');
    callback(user === adminUser && pass === adminPass);
  });
  app.use(statusMonitor.middleware);
  app.get('/status', authConnect(basic), statusMonitor.pageRoute);
}

app.options('*', cors());
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get('/boards', (req, res) => res.json(info.legacyBoards));

app.get('/libraries', (req, res) => info.libraries(null, (data) => res.json(data)));

app.post('/compile', async (req, res) => {
  if (typeof req.body.sketch !== 'string' || typeof req.body.board !== 'string') {
    res.json({ success: false, msg: 'invalid parameters passed' });
  } else {
    res.json(await program.legacyCompile({ fqbn: req.body.board, content: req.body.sketch }));
  }
});

console.log(`🚀 Server Launched on http://localhost:${process.env.PORT || 3030}`);
