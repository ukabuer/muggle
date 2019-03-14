const express = require('express');
const { resolve } = require('path');

module.exports = function createRouter(manager, options) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    const pages = await manager.getPages();

    const path = pages.has(req.path) ? req.path : `${req.path}index.html`;

    if (!pages.has(path)) {
      next();
      return;
    }

    const page = pages.get(path);
    const xml = await page.render(pages);

    res.write(xml, page.encode);
    res.end();
  });

  router.use('/static', express.static('./static'));
  router.use('/static', express.static(resolve(options.theme, 'static')));

  return router;
};
