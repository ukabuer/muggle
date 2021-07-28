import { hydrate } from "preact";
import fetch from "isomorphic-unfetch";
import { Router } from "wouter-preact";
import { createAsyncPage } from "./AyncPage";
import App from "../site/app";

const items = import.meta.glob("../site/routes/**/*.tsx");
const pages = Object.entries(items).map(([file, loader]) => {
  const page = createAsyncPage(file, () => loader(), fetch);
  return page;
});

function renderToDOM(url: string) {
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

renderToDOM(window.location.pathname);
