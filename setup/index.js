const { spawn } = require('child_process');
const fs = require('fs').promises;
// eslint-disable-next-line import/no-unresolved
const libs = require('../data/libs.json').libraries;
// eslint-disable-next-line import/no-unresolved
const cores = require('../data/cores.json');

const cli = (commands, args, consoleLog = false) => new Promise((resolve) => {
  let res = '';
  const exec = spawn(`${__dirname}/../arduino-cli`, [
    ...(Array.isArray(commands) ? commands : commands.split('.')),
    ...(Array.isArray(args) ? args : [args]).map((arg) => `${`${arg}`.replace(/"/g, '')}`),
    ...(process.env.CLI_ARGS || `--config-file ${__dirname}/../data/arduino-cli.yml --format json`).split(' '),
  ], { cwd: `${__dirname}/../` });

  exec.on('close', () => resolve(res));
  const log = (data) => {
    if (consoleLog) console.log(data.toString('utf-8'));
    res += data.toString('utf-8');
  };
  exec.stdout.on('data', log);
  exec.stderr.on('data', log);
});

const loadLibs = () => libs.reduce(async (a, lib, i) => {
  await a;
  console.log(`Libs (${i + 1}/${libs.length}) Installing ${lib.name}`);
  await cli('lib.install', lib.name, true);
}, Promise.resolve());

const loadCores = () => cores.reduce(async (a, core, i) => {
  await a;
  console.log(`Cores (${i + 1}/${cores.length}) Installing ${core.Name} (${core.ID})`);
  await cli('core.install', core.ID, true);
}, Promise.resolve());

const loadBoards = async () => {
  const res = await cli('board.listall', []);
  const response = JSON.parse(res);
  console.log(`Compiling ${response.boards.length} board details...`);
  const boards = await Promise.all(response.boards.map(async (board) => {
    const details = await cli('board.details', [board.FQBN]);
    return {
      fqbn: board.FQBN || board.fqbn,
      ...JSON.parse(details),
    };
  }));
  await fs.writeFile(`${__dirname}/../data/boards.json`, JSON.stringify(boards, null, 2));
  console.log('Done!');
};

// loadCores().then(loadLibs).then(loadBoards);
switch (process.argv[2]) {
case 'cores':
  loadCores();
  break;
case 'libs':
  loadLibs();
  break;
case 'boards':
  loadBoards();
  break;
default:
  console.error('unknown command');
}
