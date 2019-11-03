/* eslint-disable no-param-reassign */
const fs = require('fs').promises;
const path = require('path');
const tmp = require('tmp-promise');
// TODO set up symlink to staging files (downloads)
const files = {

  checkPath: (filepath, socket, sub = '') => {
    if (filepath.indexOf(path.join(socket.tmpDir.path, sub)) !== 0) {
      const msg = `Security error, path "${filepath}" went out of bounds.`;
      socket.emit('console.error', msg);
      throw new Error(msg);
    }
  },

  _initTmp: async () => {
    const tmpDir = await tmp.dir({ prefix: 'duino-', unsafeCleanup: true });
    return tmpDir;
  },

  cleanup: (socket) => {
    if (socket.tmpDir) {
      socket.tmpDir.cleanup();
      delete socket.tmpDir;
    }
  },

  loadTempFiles: async (fileItems, socket, sub = '', done) => {
    if (typeof sub !== 'string') {
      done = sub;
      sub = '';
    }
    // eslint-disable-next-line no-param-reassign
    socket.tmpDir = socket.tmpDir || await files._initTmp();
    // const id = socket.tmpDir.path.split('/').pop();
    await Promise.all(fileItems.map(async (file) => {
      const filepath = path.join(socket.tmpDir.path, sub, file.name);
      files.checkPath(filepath, socket, sub);
      await fs.writeFile(filepath, file.content);
      if (/.ino$/.test(file.name)) socket.sketchPath = filepath;
    }));
    if (done) done();
  },
};

module.exports = files;
