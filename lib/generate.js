const path = require('path');
const fse = require('fs-extra');
const { render } = require('./render');

async function generate(page, pages, config) {
  const xml = await render(page, pages, config, false);
  if (!xml) return;
  const prefix = config.public;
  const name = page.path.substr(1);
  const ext = path.extname(page.path);
  const postfix = ext ? '' : 'index.html';
  const file = `${prefix}${name}${postfix}`;
  await fse.outputFile(file, xml);
}

module.exports = generate;
