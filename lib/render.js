const debug = require('debug')('muggle:render');
const path = require('path');
const marked = require('marked');
const jsYaml = require('js-yaml');
const { readFile, existsSync } = require('fs-extra');
const pug = require('pug');
const { isMarkdown } = require('./utils');

const mdRenderer = new marked.Renderer();

const CONFIG_FILENAME = 'muggle.config.js';
const configExist = existsSync(CONFIG_FILENAME);
if (configExist) {
  const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);
  const config = require(configPath); // eslint-disable-line
  Object.assign(mdRenderer, config.markdown);
}

marked.setOptions({
  renderer: mdRenderer,
  pedantic: false,
  gfm: true,
});

const regexp = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/;

/**
 * compile markdown file with yaml front-matter
 * @param {string} filePath file path
 */
async function compileMarkdown(filePath) {
  const res = await isMarkdown(filePath);
  if (!res) return null;
  const text = await readFile(filePath, {
    encoding: 'utf-8',
  });
  const { 2: yaml, 3: markdown = '' } = regexp.exec(text);
  const data = yaml ? jsYaml.safeLoad(yaml) : {};
  const html = marked(markdown);
  return { ...data, content: html };
}

async function handleFile(filepath) {
  if (!filepath) return {};
  const ext = path.extname(filepath);
  let data = {};
  if (ext === '.md') {
    data = await compileMarkdown(filepath);
  } else if (ext === '.json') {
    const str = await readFile(filepath, 'utf-8');
    data = str ? JSON.parse(str) : {};
  } else if (ext === '.yaml') {
    const yaml = await readFile(filepath, 'utf-8');
    data = yaml ? jsYaml.safeLoad(yaml) : {};
  }
  return data;
}

async function render(page, config, isServe = true) {
  const stack = [page];
  const tasks = [];
  while (stack.length) {
    const current = stack[stack.length - 1];
    if (
      Array.isArray(current.deps)
      && current.deps.count !== 0
    ) {
      const { deps } = current;
      if (!deps.count) {
        deps.count = deps.length;
      }
      const dep = deps[deps.count - 1];
      dep.PARENT = current.deps;
      stack.push(dep);
      deps.count -= 1;
    } else {
      const task = handleFile(current.dataFile)
        .then((data) => {
          if (!isServe && data.draft) {
            const index = current.PARENT.indexOf(current);
            if (index !== -1) {
              current.PARENT.splice(index, 1);
            }
          }
          delete current.PARENT;
          Object.assign(current, data);
        });
      tasks.push(task);
      stack.pop();
    }
  }
  await Promise.all(tasks);

  if (!isServe && page.draft) return null;

  debug(JSON.stringify(page, null, 2));
  const json = await readFile(config.site, 'utf8');
  const site = JSON.parse(json);
  return pug.renderFile(page.template, {
    page, site,
  });
}

module.exports = render;
