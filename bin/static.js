#!/usr/bin/env node

const debug = require('debug')('marker:entry');
const path = require('path');
const program = require('commander');
const createServer = require('../lib/server');
const parse = require('../lib/parse');
const { write } = require('../lib/render');
const { readFile } = require('../lib/utils');

const abs = name => path.resolve(__dirname, name);
const config = {
  site: abs('../test/contents/site.json'),
  contentsDir: abs('../test/contents'),
  templatesDir: abs('../test/templates'),
  publicDir: abs('../test/public'),
  port: 8080,
};

const getRoutes = () => readFile(config.site, 'utf8').then(async (json) => {
  const data = JSON.parse(json);
  const tasks = data.routes.map(route => parse(route, config));
  const results = await Promise.all(tasks);
  return results.reduce((all, cur) => all.concat(cur), []);
});

program.version('0.1.0')
  .option('-s, --site <path>', 'Set site data file path, defaults to ./contents/site.json', './site.json')
  .option('-c, --content <path>', 'Set the contents directory', './contents/')
  .option('-t, --template <path>', 'Set the templates directory', './templates/');

program
  .command('serve')
  .description('run a dev server at sepecific port, defaults to :8080')
  .option('-p, --port <port>', 'Set the server port', 8080)
  .action((options) => {
    const { port } = options;
    const { site, content, template } = options.parent;
    getRoutes()
    .then((routes) => {
      debug(routes);
      createServer(routes, config);
    });
  });

program
  .command('gen')
  .description('generate HTML files in the public directory')
  .option('-p, --public <path>', 'Set the public directory', './public')
  .action((options) => {
    const { public } = options;
    const { site, content, template } = options.parent;
    getRoutes()
    .then((routes) => {
      const tasks = routes.map(route => write(route, config));
      return Promise.all(tasks);
    })
    .then(() => {
      console.log('Generated!')
      process.exit();
    });
  });

program.parse(process.argv);
