const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

const scheme = {
  type: 'object',
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          template: { type: 'string' },
          file: { type: 'string' },
          dir: { type: 'string' },
          deps: {
            type: 'array',
            items: {
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
            },
          },
        },
        required: ['path', 'template'],
      },
    },
  },
  required: ['pages'],
};

const validate = ajv.compile(scheme);

module.exports = validate;
