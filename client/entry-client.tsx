import { hydrate } from "preact";
import fetch from "unfetch";
import { Router } from "wouter-preact";
import { createAsyncPage } from "./AyncPage";
import App from './app';

const items = import.meta.glob("../../../pages/**/*.tsx");

const pages = Object.entries(items).map(([file, loader]) => {
  const page = createAsyncPage(file, () => loader(), fetch as any);
  return page;
});

function renderToDOM() {
  let url = window.location.pathname;
  if (!url.endsWith("/")) {
    url += "/";
  }

  const page = pages.find((page) => page.Match(url)[0]);
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

renderToDOM();
