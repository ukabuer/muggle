const path = require('path');
const fse = require('fs-extra');
const render = require('./render');

async function generate(route, config) {
  const html = await render(route, config, false);
  if (!html) return;
  const prefix = config.public;
  const name = route.path.substr(1);
  const ext = path.extname(route.path);
  const postfix = ext ? '' : 'index.html';
  const file = `${prefix}${name}${postfix}`;
  await fse.outputFile(file, html);
}

module.exports = generate;
