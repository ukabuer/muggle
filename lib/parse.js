const path = require('path');
const { readFilesInDir } = require('./utils');

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
        const pathTemplate = current.path;
        const url = pathTemplate.replace(':filename', name);
        const filepath = resolve(content, `${current.dir}/${filename}`);
        const item = Object.create(null);
        item.path = url;
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
      item.path = current.path;
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
      }
      routes.push(item);
      queue.pop();
    }
  }
  return routes;
}

module.exports = parse;
