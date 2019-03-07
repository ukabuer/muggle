module.exports = function validate(options) {
  const { pages, theme, public: publicDir } = options;
  const errors = [];
  if (typeof pages !== 'string') {
    errors.push(new Error('\'pages\' should be the path to the pages\' directory'));
  }

  if (typeof theme !== 'string') {
    errors.push(new Error('\'theme\' should be the path to the theme\'s directory'));
  }

  if (typeof publicDir !== 'string') {
    errors.push(new Error('\'public\' should be the path to the public directory'));
  }

  return errors;
};
