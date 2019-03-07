const express = require('express');
const { resolve } = require('path');

module.exports = function createRouter(manager, options) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    await manager.processing;

    const path = manager.pages.has(req.path) ? req.path : `${req.path}index.html`;

    if (!manager.pages.has(path)) {
      next();
      return;
    }

    const page = manager.pages.get(path);
    await page.processing;

    res.write(page.xml, page.encode);
    res.end();
  });

  router.use('/static', express.static('./static'));
  router.use('/static', express.static(resolve(options.theme, 'static')));

  return router;
};
