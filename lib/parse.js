const path = require('path');
const {
  readFilesInDir,
  withTailSlash: WTS,
} = require('./utils');

const { resolve } = path;

async function parse(root, config) {
  const queue = [root];
  const parents = [];
  const routes = [];
  const { content, template: templatesDir } = config;
  let current;
  while (queue.length) {
    current = queue[queue.length - 1];
    const { template } = current;
    // if set `dir`, shouldn't have `deps`
    if (current.deps && current.deps.length) {
      if (!current.isCreated) {
        parents.push([]);
        current.isCreated = true;
      }
      queue.push(current.deps.pop());
    } else if (current.dir) {
      const filenames = await readFilesInDir(resolve(content, current.dir));
      // handle deps
      for (let i = 0; i < filenames.length; i += 1) {
        const filename = filenames[i];
        const { name } = path.parse(filename);
        const url = current.path.replace(':filename', name);
        const filepath = resolve(content, `${WTS(current.dir)}${filename}`);
        const item = Object.create(null);
        item.path = WTS(url);
        item.dataFile = filepath;
        item.template = resolve(templatesDir, template);
        routes.push(item);
        if (parents.length) {
          parents[parents.length - 1].push(item);
        }
      }
      queue.pop();
    } else {
      const item = Object.create(null);
      item.path = WTS(current.path);
      item.template = resolve(templatesDir, template);
      if (Array.isArray(current.deps)) {
        item.deps = parents.pop();
      }
      if (current.file) {
        const filepath = resolve(content, current.file);
        item.dataFile = filepath;
        if (parents.length) {
          parents[parents.length - 1].push(item.data);
        }
        if (Array.isArray(current.deps) && current.pagination) {
          const pages = Math.ceil(item.deps.length / current.pagination);
          for (let page = 0; page < pages; page += 1) {
            routes.push({
              ...item,
              page: page + 1,
              path: `${item.path}pages/${page + 1}/`,
            });
          }
        }
      }
      if (current.rss) {
        routes.push({
          ...item,
          template: resolve(templatesDir, current.rss.template),
          path: `${item.path}${current.rss.filename}`,
        });
      }
      routes.push(item);
      queue.pop();
    }
  }
  return routes;
}

module.exports = parse;
