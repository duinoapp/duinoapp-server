/* eslint-disable no-param-reassign */
const net = require('net');
const cli = require('../utils/arduino-exec');
const tmpFiles = require('../utils/files');

const program = {

  randId: () => Math.random().toString(16).substr(2),

  getError: (res) => {
    let obj;
    try {
      obj = JSON.parse(res.split('\n').pop());
    } catch (err) {
      return null;
    }
    if (obj && obj.Cause) return obj;
    return null;
  },

  compile: async ({ fqbn, files }, socket, done) => {
    await tmpFiles.loadTempFiles(files, socket);
    const res = await cli('compile', ['-v', '--warnings', 'all', '--fqbn', fqbn, socket.sketchPath], socket);
    const response = program.getError(res);
    tmpFiles.cleanup(socket);
    if (done) done(response);
    return response;
  },

  upload: async ({ id = program.randId(), fqbn, files }, socket, done) => {
    if (socket.uploading) return { Message: 'Already uploading, please hold.', Cause: 'Upload already initiated.' };
    socket.uploading = id;
    socket.emit('upload.id', id);
    await tmpFiles.loadTempFiles(files, socket);

    const sock = net.createServer((stream) => {
      stream.on('data', (buff) => {
        socket.emit(`upload.dataDown.${id}`, buff);
      });
      stream.on('end', () => {
        sock.close();
      });

      socket.on(`upload.dataUp.${id}`, (buff) => stream.write(buff));
    });

    const port = 4000 + Math.floor(Math.random() * 1000);
    sock.listen(port);

    const res = await cli('upload', ['-p', `net:localhost:${port}`, '-v', '--fqbn', fqbn, socket.sketchPath], socket);

    sock.close();
    socket.uploading = null;
    const response = program.getError(res);
    tmpFiles.cleanup(socket);
    if (done) done(response);
    return response;
  },

};

module.exports = program;
