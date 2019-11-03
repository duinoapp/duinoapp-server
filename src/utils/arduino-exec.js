const { spawn } = require('child_process');

module.exports = (commands, args, socket, options) => new Promise((resolve) => {
  const opts = {
    emit: !!socket,
    ...options,
  };
  let res = '';
  const log = (data) => {
    res += data.toString('utf-8');
    // console.log(data.toString('utf-8'));
    if (opts.emit) socket.emit('console.log', data.toString('utf-8'));
  };

  const exec = spawn(`${__dirname}/../../arduino-cli`, [
    ...(Array.isArray(commands) ? commands : commands.split('.')),
    ...(Array.isArray(args) ? args : [args]).map((arg) => `${`${arg}`.replace(/"/g, '')}`),
    ...(process.env.CLI_ARGS || `--config-file ${__dirname}/../../data/arduino-cli.yml --format json`).split(' '),
  ], { cwd: socket ? socket.tmpDir.path : `${__dirname}/../../` });
  exec.stdout.on('data', (data) => log(data));
  exec.stderr.on('data', (data) => log(data));

  exec.on('close', () => resolve(res));
});
