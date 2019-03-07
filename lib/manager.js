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
    this.watcher = null;
    this.options = options;
    this.processing = Promise.resolve();

    this.addPage = this.addPage.bind(this);
    this.removePage = this.removePage.bind(this);
  }

  async process() {
    const entries = await findEntries(this.options.pages);
    const tasks = entries.map(this.addPage);
    await Promise.all(tasks);

    const isProduction = process.env.NODE_ENV === 'production';
    for (const page of this.pages.values()) {
      if (isProduction && page.data.draft) {
        this.pages.delete(page.route);
      } else {
        const task = page.processDeps(this.pages);
        tasks.push(task);
      }
    }
    await Promise.all(tasks);
  }

  addPage(path) {
    const page = new Page(path, this.options);
    return page.processSelf().then(() => {
      this.pages.set(page.route, page);
    }).catch((err) => {
      error(err.message);
    });
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

  async serve(port = 1234) {
    await this.process();

    const app = express();
    const router = createRouter(this, this.options);
    app.use(router);
    router.use(tinylr.middleware({ app }));
    app.listen(port, (err) => {
      if (err) {
        log('Create Server error:', err);
      }
      log('Server listen at:', port);
      this.watch();
      for (const page of this.pages.values()) {
        page.watch(this.pages);
      }
    });
  }

  watch() {
    if (this.watcher) {
      this.watcher.close();
    }

    const { pages } = this.options;

    this.watcher = chokidar.watch('**/*', { cwd: pages });
    this.watcher.on('ready', () => {
      this.watcher.on('add', (path) => {
        if (path.endsWith('index.md')) {
          const target = resolve(pages, path);
          this.processing = Promise.all([
            this.processing,
            this.addPage(target),
          ]);
          tinylr.changed(target);
        }
      });

      this.watcher.on('unlink', (path) => {
        const name = 'index.md';
        const target = (
          path.endsWith(name)
            ? resolve(pages, path)
            : resolve(pages, path, name)
        );
        this.removePage(target);
        tinylr.changed(path);
      });
    });
  }

  write() {
    const { public: publicDir, theme } = this.options;
    const tasks = [];

    const publicStaticDir = resolve(publicDir, 'static');
    tasks.push(
      fs.copy(resolve(theme, 'static'), publicStaticDir)
        .then(() => fs.copy('static', publicStaticDir)),
    );

    for (const [route, page] of this.pages) {
      const target = resolve(publicDir, route.substr(1));
      const task = fs.outputFile(target, page.xml, page.encode);
      tasks.push(task);
    }
    return Promise.all(tasks);
  }

  async changeConfig(config) {
    this.options.site = config.site || {};
    await this.processing;
    for (const page of this.pages.values()) {
      const task = page.processDeps(this.pages);
      page.processing = Promise.all([page.processing, task]);
      tinylr.changed('config');
    }
  }
}

module.exports = Manager;
