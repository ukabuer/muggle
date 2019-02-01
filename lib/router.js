const express = require('express');

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

    res.write(page.xml);
    res.end();
  });

  router.use(express.static(options.public));

  return router;
};
