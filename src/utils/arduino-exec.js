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
    if (opts.emit && socket.emit) socket.emit('console.log', data.toString('utf-8'));
  };
  let cliArgs = process.env.CLI_ARGS || '--config-file /mnt/duino-data/arduino-cli.yml --format json';
  if (opts.noJson) cliArgs = cliArgs.replace(' --format json', '');

  const exec = spawn('/mnt/duino-data/arduino-cli', [
    ...(Array.isArray(commands) ? commands : commands.split('.')),
    ...(Array.isArray(args) ? args : [args]).map((arg) => `${`${arg}`.replace(/"/g, '')}`),
    ...(cliArgs).split(' '),
  ], { cwd: socket ? socket.tmpDir.path : `${__dirname}/../../`, env: { HOME: '/mnt/duino-data', PATH: process.env.PATH } });
  exec.stdout.on('data', (data) => log(data));
  exec.stderr.on('data', (data) => log(data));

  exec.on('close', () => resolve(res));
});
