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

async function extractData(filepath) {
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

async function render(page, pages, config, isServe = true) {
  const stack = [page];
  while (stack.length) {
    const current = stack[stack.length - 1];
    if (
      current.depPaths.length > 0
      && current.handled !== current.depPaths.length
    ) {
      current.handled += 1;
      const depPath = current.depPaths[current.handled - 1];
      const depPage = pages[depPath];
      stack.push(depPage);
    } else {
      if (stack.length > 1 && (isServe || !current.data.draft)) {
        const parent = stack[stack.length - 2];
        parent.data.deps.push(current.data);
      }
      stack.pop();
    }
  }

  if (!isServe && page.draft) return null;

  debug(JSON.stringify(page, null, 2));

  const json = await readFile(config.site, 'utf8');
  const site = JSON.parse(json);
  return pug.renderFile(page.template, {
    page: page.data, site,
  });
}

module.exports = {
  render,
  extractData,
};
