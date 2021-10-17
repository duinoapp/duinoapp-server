/* eslint-disable no-param-reassign */
const fs = require('fs').promises;
const net = require('net');
const cli = require('../utils/arduino-exec');
const tmpFiles = require('../utils/files');
const json = require('../utils/json');

const exists = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch (err) {
    Math.random(err);
    return false;
  }
};

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

  compile: async ({
    fqbn, files, noHex = false, flags = {}, libs = [],
  }, socket, done) => {
    await tmpFiles.loadTempFiles(files, socket);
    const libRes = await tmpFiles.loadTempLibs(libs, socket);
    const res = await cli('compile', [
      ...(flags.verbose ? ['-v'] : []),
      '--warnings', 'all',
      '--fqbn', fqbn,
      '--libraries', socket.libPath,
      ...(!noHex ? ['--output-dir', `${socket.sketchPath}/output`] : []),
      socket.sketchPath,
    ], socket, { noJson: true });
    const response = program.getError(res);
    if (!response.error && !noHex) {
      const ref = socket.sketchPath.split('/').pop();
      if (fqbn.indexOf('esp') !== 0) {
        try {
          const hex = await fs.readFile(`${socket.sketchPath}/output/${ref}.ino.hex`, 'base64');
          response.hex = hex;
        } catch (err) {
          console.error(err);
        }
      } else if (fqbn.indexOf('esp8266') === 0) {
        try {
          const bin = await fs.readFile(`${socket.sketchPath}/output/${ref}.ino.bin`, 'base64');
          response.files = [{ data: bin, address: 0 }];
        } catch (err) {
          console.error(err);
        }
      } else if (fqbn.indexOf('esp32') === 0) {
        const boards = await json.loadLargeData('boards');
        const baseFqbn = fqbn.split(':').slice(0, 4).join(':');
        const board = boards.find((b) => b.fqbn === baseFqbn);
        if (board) {
          const flashFreq = `${
            (fqbn.split(':').find((part) => part.includes('FlashFreq=')) || '').replace('FlashFreq=', '')
            || (board.config_options.find((o) => o.option === 'FlashFreq')
              || { values: [{ selected: true, value: '' }] }).values.find((v) => v.selected).value
            || board.properties.build.flash_freq
          }m`.replace('mm', 'm');
          const flashMode = (fqbn.split(':').find((part) => part.includes('FlashMode=')) || '').replace('FlashMode=', '')
            || (board.config_options.find((o) => o.option === 'FlashMode')
              || { values: [{ selected: true, value: '' }] }).values.find((v) => v.selected).value
            || board.properties.build.boot;
          const espToolsPath = '/mnt/duino-data/.arduino15/packages/esp32/hardware/esp32/1.0.6/tools';
          let bootPath = `${espToolsPath}/sdk/bin/bootloader_${flashMode}_${flashFreq}.bin`;
          // account for the new path for the bin in the next arduino-esp32 release. (2021-07-18)
          if (!(await exists(bootPath))) {
            bootPath = `${espToolsPath}/sdk/${board.properties.build.mcu}/bin/bootloader_${flashMode}_${flashFreq}.bin`;
          }
          try {
            const appBin = await fs.readFile(`${socket.sketchPath}/output/${ref}.ino.bin`, 'base64');
            const partBin = await fs.readFile(`${socket.sketchPath}/output/${ref}.ino.partitions.bin`, 'base64');
            const app0Bin = await fs.readFile(`${espToolsPath}/partitions/boot_app0.bin`, 'base64');
            const bootBin = await fs.readFile(bootPath, 'base64');
            response.files = [
              { data: app0Bin, address: 0xe000 },
              { data: bootBin, address: Number(board.properties.build.bootloader_addr) || 0x1000 },
              { data: appBin, address: 0x10000 },
              { data: partBin, address: 0x8000 },
            ];
            response.flash_freq = flashFreq;
            response.flash_mode = flashMode;
          } catch (err) {
            console.error(err);
          }
        }
      }
    }
    response.log = libRes + res;
    // tmpFiles.cleanup(socket);
    if (done) done(response);
    return response;
  },

  upload: async ({ id = program.randId(), fqbn, flags = {} }, socket, done) => {
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

    const res = await cli('upload', [
      '-p', `net:localhost:${port}`,
      ...(flags.verbose ? ['-v'] : []),
      ...(flags.programmer ? ['-P', flags.programmer] : []),
      '--fqbn', fqbn,
      socket.sketchPath,
    ], socket, { noJson: true });

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
      '--output-dir',
      `${session.sketchPath}/legacy`,
      session.sketchPath,
    ], null, { noJson: true });
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
    const ref = session.sketchPath.split('/').pop();
    const hex = await fs.readFile(`${session.sketchPath}/legacy/${ref}.ino.hex`, 'base64');
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
