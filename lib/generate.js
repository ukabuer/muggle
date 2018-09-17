const fse = require('fs-extra');
const render = require('./render');

async function generate(route, config) {
  const html = await render(route, config);
  const prefix = config.public;
  const name = route.path.substr(1);
  const file = `${prefix}${name}index.html`;
  await fse.outputFile(file, html);
}

module.exports = generate;
