const fse = require('fs-extra');
const path = require('path');

const readFilesInDir = async (dir) => {
  const names = await fse.readdir(dir);
  const tasks = names.map(async (name) => {
    const file = path.resolve(dir, name);
    const stat = await fse.stat(file);
    return { name, stat };
  });
  const files = await Promise.all(tasks);
  return files.filter(({ stat }) => stat.isFile()).map(file => file.name);
};

const ensureDirExist = async (file) => {
  const dirname = path.dirname(file);
  const exist = await fse.exists(dirname);
  if (exist) return Promise.resolve(true);
  await ensureDirExist(dirname);
  return fse.mkdirSync(dirname);
};

const isMarkdown = async (file) => {
  const stat = await fse.stat(file);
  if (!stat.isFile()) return false;
  if (path.extname(file) === '.md') return true;
  return false;
};

const withTailSlash = (str) => {
  const len = str.length;
  if (str[len - 1] !== '/') {
    return `${str}/`;
  }
  return str;
};

module.exports = {
  readFilesInDir,
  ensureDirExist,
  isMarkdown,
  withTailSlash,
};
