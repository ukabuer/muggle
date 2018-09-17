const debug = require('debug')('muggle:server');
const tinylr = require('tiny-lr');
const gaze = require('gaze');
const express = require('express');
const parse = require('./parse');
const render = require('./render');
const { readFile } = require('fs-extra');

module.exports = async function createServer(config) {
  const app = express();
  app.use(async (req, res, next) => {
    const json = await readFile(config.site, 'utf8');
    const site = JSON.parse(json);
    const tasks = site.pages.map(page => parse(page, config));
    const results = await Promise.all(tasks);
    const pages = results.reduce((all, cur) => all.concat(cur), []);

    const router = express.Router();
    pages.forEach((route) => {
      router.get(route.path, async (_req, _res) => {
        let html = await render(route, config);
        const snippet = `
          <script src="/livereload.js?snipver=2&port=${config.port}"></script>
          </body>
        `;
        html = html.replace('</body>', snippet);
        _res.write(html);
        _res.end();
      });
    });
    router(req, res, next);
  });

  app.use(express.static(config.public));
  app.use(tinylr.middleware({ app }));
  app.listen(config.port, () => {
    console.log('Server starts at %s', config.port);
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
