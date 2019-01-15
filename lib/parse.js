const path = require('path');
const Page = require('./page');
const {
  filesInDir,
  addTailSlash,
} = require('./utils');

const { resolve } = path;

async function parse(list, config) {
  const pages = {};
  const map = {};
  let tasks = [];
  const {
    content: contentDir,
    template: templateDir,
  } = config;

  list.forEach((current) => {
    const ext = path.extname(current.path);
    const key = ext ? current.path : addTailSlash(current.path);
    const template = resolve(templateDir, current.template);
    if (current.dir) {
      const dir = addTailSlash(current.dir);
      const targetDir = resolve(contentDir, dir);
      map[key] = [];
      const task = filesInDir(targetDir)
        .then((filenames) => {
          filenames.forEach((filename) => {
            const { name } = path.parse(filename);
            const route = key.replace(':filename', name);
            const filepath = resolve(targetDir, filename);
            const page = new Page(route, template, filepath);
            pages[route] = page;
            map[key].push(route);
          });
        });
      tasks.push(task);
    } else {
      const route = key;
      const filepath = current.file ? resolve(contentDir, current.file) : '';
      const page = new Page(route, template, filepath, current.deps);
      pages[route] = page;
    }
  });

  await Promise.all(tasks);

  tasks = Object.keys(pages).map(route => pages[route].getData());
  await Promise.all(tasks);

  Object.keys(pages).forEach((route) => {
    const page = pages[route];
    if (!config.port && page.data.draft) {
      delete pages[route];
      return;
    }
    let depPaths = [];
    page.depPaths.forEach((depPath) => {
      if (typeof depPath === 'object') {
        const key = addTailSlash(depPath.path);
        let targets = map[key];
        if (!config.port) {
          targets = targets.filter(url => !pages[url].data.draft);
        }
        const { pagination } = depPath;
        const pageNum = Math.ceil(targets.length / pagination);
        for (let i = 0; i < pageNum; i += 1) {
          const p = {
            current: i + 1,
            total: pageNum,
          };
          const items = targets.slice(i * pagination, (i + 1) * pagination);
          if (i === 0) {
            page.data.pagination = p;
            depPaths = depPaths.concat(items);
          }
          const url = `${page.path}page/${i + 1}/`;
          pages[url] = new Page(url, resolve(templateDir, page.template), page.file, items);
          pages[url].data.pagination = p;
        }
      } else {
        const ext = path.extname(depPath);
        const key = ext ? depPath : addTailSlash(depPath);
        const target = map[key];
        if (Array.isArray(target)) {
          depPaths = depPaths.concat(target);
        } else {
          depPaths.push(key);
        }
      }
    });
    page.depPaths = depPaths;
  });
  return pages;
}

module.exports = parse;
