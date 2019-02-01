module.exports = function validate(options) {
  const { pages, templates, public: publicDir } = options;
  const errors = [];
  if (typeof pages !== 'string') {
    errors.push(new Error('\'pages\' should be the path to the pages\' directory'));
  }

  if (typeof templates !== 'string') {
    errors.push(new Error('\'templates\' should be the path to the templates\' directory'));
  }

  if (typeof publicDir !== 'string') {
    errors.push(new Error('\'public\' should be the path to the public directory'));
  }

  return errors;
};
