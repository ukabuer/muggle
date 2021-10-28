import { hydrate } from "preact";
import fetch from "isomorphic-unfetch";
import { Router } from "wouter-preact";
import { createAsyncPage } from "./AyncPage.js";
import App, { ErrorPath } from "./app.js";
import { Module } from "./types.js";

export default function renderToDOM(items: Record<string, () => Promise<Module>>) {
  let url = window.location.pathname;
  if (!url.endsWith("/")) {
    url += "/";
  }

  const files: typeof items = {};
  Object.keys(items).forEach((filePath) => {
    const route = filePath
      .substr(0, filePath.length - ".tsx".length)
      .replace(/\/index/, "/")
      .replace("../../pages", "");
    files[route] = items[filePath];
  });
  const pages = Object.entries(files).map(([file, loader]) => {
    return createAsyncPage(file, loader, fetch);
  });

  let page = pages.find((page) => page.Match(url)[0]);
  if (!page) {
    page = pages.find((page) => page.Match(ErrorPath)[0]);
  }
  const preload = page ? page.LoadComponent() : Promise.resolve();

  preload.then(() => {
    hydrate(
      <Router>
        <App pages={pages} initial={window.__PRELOAD_DATA__} />
      </Router>,
      document.getElementById("root") || document.body
    );
  });
}
