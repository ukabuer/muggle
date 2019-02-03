const {
  resolve, relative, sep, dirname,
} = require('path');
const fs = require('fs-extra');
const tinylr = require('tiny-lr');
const pug = require('pug');
const jsYaml = require('js-yaml');
const marked = require('marked');
const cheerio = require('cheerio');
const chokidar = require('chokidar');
const { getDeps } = require('./directive');

const regexp = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/;

class Page {
  constructor(path, options) {
    this.path = path;
    this.template = '';
    this.deps = [];
    this.watchers = new Map();
    this.options = options;
    this.processing = Promise.resolve();
    this.encode = 'utf8';
    this.route = '';

    this.data = { path: this.route.replace(/index\.html$/, '') };
    this.xml = '';
    this.$ = null;
  }

  async process(pages) {
    await this.processSelf();
    await this.processDeps(pages);
  }

  async processSelf() {
    const raw = await fs.readFile(this.path, this.encode);
    const { 2: yaml, 3: markdown = '' } = regexp.exec(raw);

    const extracted = yaml ? jsYaml.safeLoad(yaml) : {};
    Object.assign(this.data, extracted);
    this.data.content = marked(markdown);

    const { template } = this.data;
    if (!template) {
      const err = `ERROR: ${this.path} should define 'template'`;
      throw new Error(err);
    }

    this.template = resolve(this.options.templates, template);

    const relativePath = relative(this.options.pages, this.path);
    const extname = extracted.xml ? '.xml' : '.html';
    const parts = relativePath.replace(/\.md$/, extname).split(sep);
    this.route = `/${parts.join('/')}`;
  }

  async processDeps(pages) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.deps = [this.template];

    const template = await fs.readFile(this.template, this.encode);
    const compiled = pug.compile(template, {
      filename: this.template,
      basedir: this.options.templates,
      pretty: !isProduction,
      compileDebug: true,
    });
    this.deps = this.deps.concat(compiled.dependencies);

    let pageDeps = [];
    if (this.data.deps) {
      const target = resolve(dirname(this.path), this.data.deps);
      pageDeps = getDeps(target, [...pages.values()]);
    }

    const { site } = this.options;
    const xml = compiled({
      site,
      page: {
        ...this.data,
        deps: pageDeps,
      },
    });
    this.$ = cheerio.load(xml, {
      xmlMode: this.data.xml,
      decodeEntities: false,
    });
    if (isProduction) {
      this.$('body').append('<script src="/livereload.js?snipver=2"></script>');
    }
    this.xml = this.$.html();
  }

  watch(pages) {
    this.watchSelf(pages);
    this.watchDeps(pages);
  }

  watchSelf(pages) {
    if (this.watchers.has('self')) {
      const watcher = this.watchers.get('self');
      watcher.close();
    }

    const watcher = chokidar.watch(this.path);
    watcher.on('change', () => {
      const task = this.process(pages);
      this.processing = Promise.all([this.processing, task]);
      tinylr.changed(this.path);
    });
    this.watchers.set('self', watcher);
  }

  watchDeps(pages) {
    if (this.watchers.has('deps')) {
      const watcher = this.watcher.get('deps');
      watcher.close();
    }

    const watcher = chokidar.watch(this.deps);
    watcher.on('ready', () => {
      watcher.on('all', (event, filepath) => {
        const task = this.processDeps(pages);
        this.processing = Promise.all([this.processing, task]);
        tinylr.changed(filepath);
      });
    });
    this.watchers.set('deps', watcher);
  }
}

module.exports = Page;
