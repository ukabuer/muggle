const { relative, resolve } = require('path');

function getDeps(target, pages) {
  const deps = pages.filter((page) => {
    const relativePath = relative(target, page.path);
    return !relativePath.startsWith('..') && page.path !== resolve(target, 'index.md');
  }).map(page => page.data);
  return deps;
}

module.exports = {
  getDeps,
};
