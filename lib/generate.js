const fse = require('fs-extra');
const render = require('./render');
const { withTailSlash } = require('./utils');

async function generate(route, config) {
  const html = await render(route, config);
  const prefix = withTailSlash(config.public);
  const name = withTailSlash(route.path).substr(1);
  const file = `${prefix}${name}index.html`;
  await fse.outputFile(file, html);
}

module.exports = generate;
