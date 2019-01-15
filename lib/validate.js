const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

const depScheme = {
  anyOf: [
    { type: 'string' },
    {
      type: 'object',
      properties: {
        path: { type: 'string' },
        pagination: { type: 'integer' },
      },
      required: ['path', 'pagination'],
    },
  ],
};

const pageScheme = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    template: { type: 'string' },
    file: { type: 'string' },
    dir: { type: 'string' },
    deps: {
      type: 'array',
      items: depScheme,
    },
  },
  required: ['path', 'template'],
};

const scheme = {
  type: 'object',
  properties: {
    pages: {
      type: 'array',
      items: pageScheme,
    },
  },
  required: ['pages'],
};

const validate = ajv.compile(scheme);

module.exports = validate;
