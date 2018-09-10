#!/usr/bin/env node

const debug = require('debug')('static:entry');
const program = require('commander');
const { readFile, ensureDir } = require('fs-extra');
const createServer = require('../lib/serve');
const parse = require('../lib/parse');
const generate = require('../lib/generate');

function getPages(config) {
  return readFile(config.site, 'utf8')
    .then(async (json) => {
      const data = JSON.parse(json);
      const tasks = data.pages.map(pagte => parse(pagte, config));
      const results = await Promise.all(tasks);
      return results.reduce((all, cur) => all.concat(cur), []);
    });
}

program.version('0.1.0')
  .option('-s, --site <path>', 'Set site data file path, defaults to ./contents/site.json', './site.json')
  .option('-c, --content <path>', 'Set the contents directory, defaults to ./contents', './contents/')
  .option('-t, --template <path>', 'Set the templates directory', './templates/')
  .option('-p, --public <path>', 'Set the public directory', './public');

program
  .command('serve')
  .description('run a dev server at sepecific port, defaults to :8080')
  .option('-p, --port <port>', 'Set the server port', 8080)
  .action((options) => {
    const {
      site,
      content,
      template,
      public: publicDir,
    } = options.parent;
    const config = {
      port: options.port,
      site,
      content,
      template,
      public: publicDir,
    };
    ensureDir(publicDir)
      .then(() => getPages(config))
      .then((routes) => {
        debug(routes);
        createServer(routes, config);
      });
  });

program
  .command('gen')
  .description('generate HTML files in the public directory')
  .action((options) => {
    const { site, content, template } = options.parent;
    const config = {
      public: options.parent.public,
      site,
      content,
      template,
    };
    getPages(config)
      .then((routes) => {
        const tasks = routes.map(route => generate(route, config));
        return Promise.all(tasks);
      })
      .then(() => {
        console.log('Generated!');
        process.exit();
      });
  });

program.parse(process.argv);
