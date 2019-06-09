const { spawn } = require('child_process');

export default (commands, args, socket, options) => new Promise((resolve) => {
  const opts = Object.assign({}, {
    emit: true,
  }, options);
  let res = '';
  const log = (data) => {
    res += data;
    if (opts.emit) socket.emit('console.log', data);
  };

  const exec = spawn(`${__dirname}/../bin/arduino-cli`, [
    ...(Array.isArray(commands) ? commands : commands.split('.')),
    args.map(arg => `"${`${arg}`.replace(/"/g, '')}"`),
    '--config-file',
    `${socket.tmpDir.path}/arduino-cli.yaml`,
    '--format',
    'json',
  ], { cwd: socket.tmpDir.path });
  exec.stdout.on('data', data => log(data));
  exec.stderr.on('data', data => log(data));

  exec.on('close', () => resolve(res));
});
