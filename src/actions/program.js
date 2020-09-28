/* eslint-disable no-param-reassign */
const fs = require('fs').promises;
const net = require('net');
const cli = require('../utils/arduino-exec');
const tmpFiles = require('../utils/files');

const program = {

  randId: () => Math.random().toString(16).substr(2),

  getError: (res) => {
    let error;
    try {
      error = JSON.parse(res.split('\n').pop());
    } catch (err) {
      return {};
    }
    if (error && error.Cause) return { error };
    return {};
  },

  compile: async ({ fqbn, files, noHex = false }, socket, done) => {
    await tmpFiles.loadTempFiles(files, socket);
    const res = await cli('compile', [
      '-v',
      '--warnings', 'all',
      '--fqbn', fqbn,
      ...(!noHex ? ['--output', `${socket.sketchPath}/output`] : []),
      socket.sketchPath,
    ], socket);
    const response = program.getError(res);
    if (!response.error && !noHex) {
      const hex = await fs.readFile(`${socket.sketchPath}/output.hex`, 'base64');
      response.hex = hex;
    }
    // tmpFiles.cleanup(socket);
    if (done) done(response);
    return response;
  },

  upload: async ({ id = program.randId(), fqbn }, socket, done) => {
    if (socket.uploading) return { Message: 'Already uploading, please hold.', Cause: 'Upload already initiated.' };
    socket.uploading = id;
    socket.emit('upload.id', id);
    // await tmpFiles.loadTempFiles(files, socket);

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
    // tmpFiles.cleanup(socket);
    if (done) done(response);
    return response;
  },

  legacyCompile: async ({ fqbn, content }) => {
    const session = {};
    const files = [{ name: 'legacy/legacy.ino', content }];
    await tmpFiles.loadTempFiles(files, session);
    const res = await cli('compile', [
      '-v',
      '--warnings',
      'all',
      '--fqbn',
      fqbn,
      '--output',
      `${session.sketchPath}/legacy`,
      session.sketchPath,
    ]);
    const response = program.getError(res);
    if (response.error) {
      return {
        success: false,
        msg: response.error.Cause,
        code: response.error.Code,
        stdout: '',
        stderr: res,
      };
    }
    const hex = await fs.readFile(`${session.sketchPath}/legacy.hex`, 'base64');
    tmpFiles.cleanup(session);
    return {
      success: true,
      hex,
      stdout: res,
      stderr: '',
    };
  },

};

module.exports = program;
