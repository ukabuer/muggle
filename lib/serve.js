const debug = require('debug')('muggle:server');
const tinylr = require('tiny-lr');
const gaze = require('gaze');
const express = require('express');
const render = require('./render');

module.exports = function createServer(routes, config) {
  const app = express();
  app.use(express.static(config.public));
  routes.forEach((route) => {
    app.get(route.path, async (req, res) => {
      let html = await render(route, config);
      const snippet = `
        <script src="/livereload.js?snipver=2&port=${config.port}"></script>
        </body>
      `;
      html = html.replace('</body>', snippet);
      res.write(html);
      res.end();
    });
  });
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
