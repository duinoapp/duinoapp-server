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
    const tmpDir = await tmp.dir({ prefix: 'cd-', unsafeCleanup: true });
    await fs.mkdir(path.join(tmpDir.path, 'data'));
    await fs.symlink(path.join(__dirname, '../../bin/staging'), path.join(tmpDir.path, 'data/staging'));
    await fs.symlink(path.join(__dirname, '../../bin/packages'), path.join(tmpDir.path, 'data/packages'));
    return tmpDir;
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
    }));
    if (done) done();
  },

  setSketch: (sketchPath, socket, sub = '', done) => {
    if (typeof sub !== 'string') {
      done = sub;
      sub = '';
    }
    const fullPath = path.join(socket.tmpDir.path, sub, sketchPath);
    files.checkPath(fullPath, socket, sub);
    // eslint-disable-next-line no-param-reassign
    socket.sketchPath = fullPath;
    if (done) done();
  },
};

export default files;
