const debug = require('debug')('muggle:server');
const tinylr = require('tiny-lr');
const gaze = require('gaze');
const express = require('express');
const { readFile } = require('fs-extra');
const parse = require('./parse');
const { render } = require('./render');

const { log } = console;

module.exports = async function createServer(config) {
  const app = express();
  app.use(async (req, res, next) => {
    const json = await readFile(config.site, 'utf8');
    const site = JSON.parse(json);

    const pages = await parse(site.pages, config);

    const router = express.Router();
    Object.keys(pages).forEach((route) => {
      const page = pages[route];
      router.get(route, async (_req, _res) => {
        let xml = await render(page, pages, config);
        const snippet = `
          <script src="/livereload.js?snipver=2&port=${config.port}"></script>
          </body>
        `;
        xml = xml.replace('</body>', snippet);
        _res.write(xml);
        _res.end();
      });
    });
    router(req, res, next);
  });

  app.use(express.static(config.public));
  app.use(tinylr.middleware({ app }));
  app.listen(config.port, () => {
    log('Server starts at %s', config.port);
  });

  const { site, content, template } = config;
  gaze([
    site,
    `${content}**/*`,
    `${template}**/*`,
    `${config.public}**/*`,
  ], (err, watcher) => {
    debug('watched');
    debug(watcher.watched());
    watcher.on('changed', (filepath) => {
      debug(`file changed: ${filepath}`);
      tinylr.changed(filepath);
    });
  });

  return app;
};
