const http = require('http');
const tinylr = require('tiny-lr');
const chokidar = require('chokidar');
const send = require('send');
const createRouter = require('find-my-way');
const debug = require('debug')('marker:server');
const { render } = require('./render');

module.exports = function createServer(routes, config) {
  const router = createRouter({
    defaultRoute: (req, res) => {
      res.statusCode = 404;
      res.write('Not Found.');
      res.end();
    },
  });
  router.on('GET', '/assets/*', async (req, res, params) => {
    send(req, params['*'], { root: './public/assets' }).pipe(res);
  });
  router.on('GET', '/build/*', async (req, res, params) => {
    send(req, params['*'], { root: './public/build' }).pipe(res);
  });
  routes.forEach((route) => {
    router.on('GET', route.path, async (req, res) => {
      let html = await render(route, config);
      const lrPort = config.port + 1;
      const snippet = `
        <script>
          var src = 'http://' + location.hostname + ':${lrPort}/livereload.js?snipver=2&port=${lrPort}';
          document.write('<script src="' + src + '"><' + '/script>');
        </script>
        </body>
      `;
      html = html.replace('<\/body>', snippet);

      res.write(html);
      res.end();
    });
  });
  const server = http.createServer(router.lookup.bind(router));
  server.listen(config.port, () => {
    debug('Server starts at %s', config.port);
  });
  const reloader = tinylr({
    liveCSS: false,
  });
  reloader.listen(config.port + 1, () => {
    debug('Live reload server starts at %s', config.port + 1);
  });

  const { contentsDir, templatesDir, publicDir } = config;
  const watcher = chokidar.watch([contentsDir, templatesDir, publicDir]);
  watcher.on('ready', () => {
    watcher.on('change', (file) => {
      reloader.notifyClients([file]);
    });
  });
  return server;
};
