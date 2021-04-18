const axios = require('axios');
const fs = require('fs').promises;
const Zip = require('adm-zip');
const tar = require('tar');

const mkdir = async (path) => {
  try {
    await fs.mkdir(path, { recursive: true });
  } catch (err) { Math.random(err); }
};

module.exports = async (url, file, postAction, path, skipDLIfExists) => {
  let data;
  try {
    data = await fs.stat(file);
  } catch (err) { Math.random(err); }
  const parts = file.split('/');
  parts.pop();
  const folder = parts.join('/');
  if (!data) {
    await mkdir(folder);
  }
  if (path) {
    await mkdir(path);
  }
  if (!data || !data.mtime || !skipDLIfExists) {
    const res = await axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
      timeout: 10 * 1000,
      headers: data && data.mtime ? {
        'If-Modified-Since': data.mtime,
      } : undefined,
    });
    switch (res.status) {
    case 304:
      break;
    case 200:
      await fs.writeFile(file, Buffer.from(res.data, 'binary'));
      break;
    default:
      throw new Error(`Failed to fetch file ${file} (${res.status}) ${res.statusText}`);
    }
  }
  switch (postAction) {
  case 'unzip':
    const zip = new Zip(file);
    zip.extractAllTo(path || folder, true);
    break;
  case 'untar':
    await tar.x({
      file,
      cwd: path || folder,
    });
    break;
  default:
  }
};
