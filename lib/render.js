const debug = require('debug')('muggle:render');
const path = require('path');
const marked = require('marked');
const jsYaml = require('js-yaml');
const { readFile } = require('fs-extra');
const pug = require('pug');
const { isMarkdown } = require('./utils');

marked.setOptions({
  renderer: marked.Renderer(),
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
  const ext = path.extname(filepath);
  let data = null;
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

async function render(route, config) {
  const { site: siteDataFile } = config;
  let deps = [];
  if (route.deps && route.deps.length) {
    const tasks = route.deps.map(async dep => ({
      path: dep.path,
      ...await handleFile(dep.dataFile),
    }));
    deps = await Promise.all(tasks);
  }
  const data = route.dataFile ? await handleFile(route.dataFile) : {};
  data.deps = deps;
  debug(JSON.stringify(data));
  const json = await readFile(siteDataFile, 'utf8');
  const site = JSON.parse(json);
  return pug.renderFile(route.template, {
    page: data,
    site,
  });
}

module.exports = render;
