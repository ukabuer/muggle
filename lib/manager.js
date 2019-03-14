const { resolve, extname } = require('path');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const tinylr = require('tiny-lr');
const express = require('express');
const Page = require('./page');
const createRouter = require('../lib/router');

const { log, error } = console;

async function findEntries(dir) {
  const entries = [];
  const stack = [dir];

  /* eslint-disable no-await-in-loop */
  while (stack.length > 0) {
    const current = stack.pop();
    const names = await fs.readdir(current);
    const paths = names.map(name => resolve(current, name));
    const tasks = paths.map(path => fs.stat(path));
    const stats = await Promise.all(tasks);

    for (let i = 0; i < stats.length; i += 1) {
      const stat = stats[i];
      const path = paths[i];
      if (stat.isFile()) {
        if (extname(path) === '.md') {
          entries.push(path);
        }
      } else {
        stack.push(path);
      }
    }
  }
  /* eslint-enable no-await-in-loop */
  return entries;
}

class Manager {
  constructor(options) {
    this.pages = new Map();
    this.watchers = new Map();
    this.serveMode = false;
    this.options = options;
    this.processing = Promise.resolve();

    this.addPage = this.addPage.bind(this);
    this.removePage = this.removePage.bind(this);
  }

  async init() {
    const entries = await findEntries(this.options.pages);
    const tasks = entries.map(this.addPage);
    await Promise.all(tasks);
    if (this.serveMode) {
      this.watch();
    }
  }

  async addPage(path) {
    const page = new Page(path, this.options, this.serveMode);
    try {
      await page.getData();
      if (this.serveMode || !page.data.draft) {
        this.pages.set(page.route, page);
      }
    } catch (err) {
      error(err.message);
    }
  }

  removePage(path) {
    let target = null;
    for (const page of this.pages.values()) {
      if (page.path === path) {
        target = page;
        break;
      }
    }

    if (!target) {
      return;
    }

    const { watchers } = target;
    for (const watcher of watchers.values()) {
      watcher.close();
    }
    this.pages.delete(target.route);
  }

  async getPages() {
    await this.processing;
    return this.pages;
  }

  async serve(port = 1234) {
    this.serveMode = true;
    await this.init();

    const app = express();
    const router = createRouter(this, this.options);
    app.use(router);
    router.use(tinylr.middleware({ app }));
    app.listen(port, (err) => {
      if (err) {
        log('Create Server error:', err);
      }
      log('Server listen at:', port);
    });
  }

  watch() {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }

    const { pages, theme } = this.options;

    const watcher = chokidar.watch(pages);
    watcher.on('ready', () => {
      watcher.on('add', (path) => {
        if (path.endsWith('index.md')) {
          const target = resolve('.', path);
          this.clearPagesCache();
          this.processing = Promise.all([
            this.processing,
            this.addPage(target),
          ]);
          tinylr.changed(path);
        }
      });

      watcher.on('unlink', (path) => {
        const name = 'index.md';
        const target = (
          path.endsWith(name)
            ? resolve('.', path)
            : resolve('.', path, name)
        );
        this.removePage(target);
        this.clearPagesCache();
        tinylr.changed(path);
      });
    });
    this.watchers.set('pages', watcher);

    const staticWatcher = chokidar.watch(['static', resolve(theme, 'static')]);
    staticWatcher.on('ready', () => {
      staticWatcher.on('all', (path) => {
        tinylr.changed(path);
      });
    });
    this.watchers.set('static', staticWatcher);
  }

  async write() {
    await this.init();

    const { public: publicDir, theme } = this.options;
    const tasks = [];

    const publicStaticDir = resolve(publicDir, 'static');
    tasks.push(
      fs.copy(resolve(theme, 'static'), publicStaticDir)
        .then(() => fs.copy('static', publicStaticDir)),
    );

    for (const [route, page] of this.pages) {
      const target = resolve(publicDir, route.substr(1));
      const task = page.render(this.pages).then(xml => fs.outputFile(target, xml, page.encode));
      tasks.push(task);
    }
    await Promise.all(tasks);
  }

  async changeConfig(config) {
    this.options.site = config.site || {};
    await this.processing;
    this.clearPagesCache();
    tinylr.changed('config');
  }

  clearPagesCache() {
    for (const page of this.pages.values()) {
      page.cache = '';
      tinylr.changed('config');
    }
  }
}

module.exports = Manager;
