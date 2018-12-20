const { extractData } = require('./render');

class Page {
  constructor(p, t, f = '', depPaths = []) {
    this.path = p;
    this.template = t;
    this.file = f;
    this.depPaths = depPaths.slice();
    this.handled = 0;
    this.data = {
      path: p,
      deps: [],
    };
  }

  async getData() {
    if (this.file === '') return;
    const data = await extractData(this.file);
    Object.assign(this.data, data);
  }
}

module.exports = Page;
