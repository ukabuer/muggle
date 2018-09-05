const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const isProduction = process.env.NODE_ENV === 'production';

const readFile = promisify(fs.readFile);

const writeFile = promisify(fs.writeFile);

const exsitsFile = promisify(fs.exists);

const statFile = promisify(fs.stat);

const readDir = promisify(fs.readdir);

const readFilesInDir = async (dir) => {
  const names = await readDir(dir);
  const tasks = names.map(async (name) => {
    const file = path.resolve(dir, name);
    const stat = await statFile(file);
    return { name, stat };
  });
  const files = await Promise.all(tasks);
  return files.filter(({ stat }) => stat.isFile()).map(file => file.name);
};

const mkdir = promisify(fs.mkdir);

const ensureDirExist = async (file) => {
  const dirname = path.dirname(file);
  const exist = await exsitsFile(dirname);
  if (exist) return Promise.resolve(true);
  await ensureDirExist(dirname);
  return mkdir(dirname);
};

const isMarkdown = async (file) => {
  const stat = await statFile(file);
  if (!stat.isFile()) return false;
  if (path.extname(file) === '.md') return true;
  return false;
};

module.exports = {
  isProduction,
  readFile,
  writeFile,
  exsitsFile,
  statFile,
  readDir,
  readFilesInDir,
  mkdir,
  ensureDirExist,
  isMarkdown,
};
