/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
const { spawn } = require('child_process');
const fs = require('fs').promises;
const _ = require('lodash');
const downloadFile = require('../src/utils/download-file');
const processData = require('./process-data');

const cli = (commands, args, consoleLog = false) => new Promise((resolve) => {
  let res = '';
  const exec = spawn('/mnt/duino-data/arduino-cli', [
    ...(Array.isArray(commands) ? commands : commands.split('.')),
    ...(Array.isArray(args) ? args : [args]).map((arg) => `${`${arg}`.replace(/"/g, '')}`),
    ...(process.env.CLI_ARGS || '--config-file /mnt/duino-data/arduino-cli.yml --format json').split(' '),
  ], { cwd: `${__dirname}/../`, env: { HOME: '/mnt/duino-data' } });

  exec.on('close', () => resolve(res));
  const log = (data) => {
    if (consoleLog) console.log(data.toString('utf-8'));
    res += data.toString('utf-8');
  };
  exec.stdout.on('data', log);
  exec.stderr.on('data', log);
});

const loadCli = async () => {
  await downloadFile(
    'https://github.com/arduino/arduino-cli/releases/download/0.13.0/arduino-cli_0.13.0_Linux_64bit.tar.gz',
    '/mnt/duino-data/arduino-cli.tar.gz',
    'untar',
  );
  await fs.copyFile(`${__dirname}/arduino-cli.yml`, '/mnt/duino-data/arduino-cli.yml');
};

const loadLibs = async () => {
  const libs = JSON.parse(await fs.readFile('/mnt/duino-data/libs.json', 'utf-8')).libraries;
  return libs.reduce(async (a, lib, i) => {
    await a;
    console.log(`Libs (${i + 1}/${libs.length}) Installing ${lib.name}`);
    await cli('lib.install', lib.name, true);
  }, Promise.resolve());
};

const supportedCores = [
  'arduino:avr',
  // 'arduino:samd',
  'esp8266:esp8266',
  'arduino:megaavr',
  'atmel-avr-xminis:avr',
  'emoro:avr',
  'littleBits:avr',
  'esp32:esp32',
];
const loadCores = async () => {
  const cores = JSON.parse(await fs.readFile('/mnt/duino-data/cores.json', 'utf-8'));
  return cores.reduce(async (a, core, i) => {
    await a;
    if (!supportedCores.includes(core.ID)) {
      console.log(`Cores (${i + 1}/${cores.length}) Skipping ${core.Name} (${core.ID})`);
      return;
    }
    console.log(`Cores (${i + 1}/${cores.length}) Installing ${core.Name} (${core.ID})`);
    await cli('core.install', core.ID, true);
  }, Promise.resolve());
};

const loadBoards = async () => {
  const res = await cli('board.listall', []);
  const response = JSON.parse(res);
  console.log(`Compiling ${response.boards.length} board details...`);
  const boards = [];
  await _.chunk(response.boards, 10).reduce(async (a, boardChunk, i) => {
    await a;
    await Promise.all(boardChunk.map(async (board) => {
      const details = await cli('board.details', [board.FQBN]);
      boards.push({
        fqbn: board.FQBN || board.fqbn,
        ...JSON.parse(details),
      });
    }));
    console.log((i + 1) * 10, response.boards.length);
  }, Promise.resolve());
  await fs.writeFile('/mnt/duino-data/boards.json', JSON.stringify(boards, null, 2));
  console.log('Done!');
};

// loadCores().then(loadLibs).then(loadBoards);
switch (process.argv[2]) {
case 'cli':
  loadCli();
  break;
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
  module.exports = {
    loadCores,
    loadLibs,
    loadBoards,
    loadCli,
    processData: () => processData(supportedCores),
  };
}
