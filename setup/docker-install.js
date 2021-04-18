const { spawn } = require('child_process');
const {
  loadCores, loadBoards, loadCli, processData, // loadLibs,
} = require('./index');
// const downloadFile = require('../src/utils/download-file');

const cmd = (...args) => new Promise((resolve) => {
  const exec = spawn(...args);
  exec.stdout.on('data', (data) => console.log(data.toString('utf-8')));
  exec.stderr.on('data', (data) => console.log(data.toString('utf-8')));
  exec.on('close', (code) => code || resolve());
  exec.on('error', (err) => resolve(err));
});

(async () => {
  console.log('download and unpack the arduino-cli');
  await loadCli();
  console.log('initialise the arduino-cli indexes and download the raw cores/libs data');
  const err = await cmd(`${__dirname}/load-data.sh`, [], { env: { HOME: '/mnt/duino-data' } });
  if (err) throw err;
  console.log('install the cores and boards');
  await loadCores();
  await loadBoards();
  // await loadLibs();
  console.log('convert the raw cores/libs data into smaller and more usable formats');
  await processData();
})();
