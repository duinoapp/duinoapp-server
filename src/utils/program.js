/* eslint-disable no-param-reassign */
import net from 'net';
import cli from './arduino-exec';

const randId = () => Math.random().toString(16).substr(2);

const getError = (res) => {
  let obj;
  try {
    obj = JSON.parse(res.split('\n').pop());
  } catch (err) {
    return null;
  }
  if (obj && obj.Cause) return obj;
  return null;
};

export const compile = async ({ fqbn }, socket, done) => {
  const res = await cli('compile', ['-v', '--warnings', 'all', '--fqbn', fqbn, socket.sketchPath], socket);
  if (done) done(getError(res));
};

export const upload = async ({ id = randId(), fqbn }, socket, done) => {
  if (socket.uploading) return;
  socket.uploading = id;
  socket.emit('upload.id', id);

  const sock = net.createServer((stream) => {
    stream.on('data', (buff) => {
      socket.emit(`upload.dataDown.${id}`, buff);
    });
    stream.on('end', () => {
      sock.close();
    });

    socket.on(`upload.dataUp.${id}`, buff => stream.write(buff));
  });

  const port = 4000 + Math.floor(Math.random() * 1000);
  sock.listen(port);

  const res = await cli('upload', ['-p', `net:localhost:${port}`, '-v', '--fqbn', fqbn, socket.sketchPath], socket);

  sock.close();
  if (done) done(getError(res));
};
