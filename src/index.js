const socketio = require('socket.io');

const info = require('./actions/info');
const program = require('./actions/program');

const io = socketio(process.env.PORT || 3030);

io.on('connection', async (socket) => {
  socket.on('info.server', (done) => info.server(socket, done));
  socket.on('info.cores', (done) => info.cores(socket, done));
  socket.on('info.libraries', (done) => info.libraries(socket, done));
  socket.on('info.boards', (done) => info.boards(socket, done));

  socket.on('compile.start', (data, done) => program.compile(data, socket, done));
  socket.on('upload.start', (data, done) => program.upload(data, socket, done));

  socket.on('disconnect', () => socket.tmpDir && socket.tmpDir.cleanup());

  socket.emit('ready');
});

io.of('/ping').on('connect', (socket) => {
  socket.on('p', (done) => info.server(socket, done));
});

console.log(`🚀 Server Launched on http://localhost:${process.env.PORT || 3030}`);
