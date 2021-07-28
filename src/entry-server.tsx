import { Router } from "wouter-preact";
import fetch from "isomorphic-unfetch";
import renderToString from "preact-render-to-string";
import staticLocationHook from "../node_modules/wouter-preact/static-location";
import Head from "./Head";
import { createAsyncPage } from "./AyncPage";
import App from "../site/app";

const items = import.meta.globEager("../site/routes/**/*.tsx");
const pages = Object.entries(items).map(([file, module]) => {
  const page = createAsyncPage(
    file,
    () => Promise.resolve(module),
    (url) => fetch("http://localhost:3000" + url)
  );
  return page;
});

export async function renderToHtml(url: string) {
  if (!url.endsWith("/")) {
    url += "/";
  }

  const page = pages.find((page) => page.Match(url)[0]);

  let data: unknown = { error: "Not Found" };
  if (page) {
    try {
      data = await page.Load(page.Match(url)[1]);
    } catch (err) {
      data = { error: err.message };
    }
  }
  const app = renderToString(
    <Router hook={staticLocationHook(url)}>
      <App pages={pages} initial={data} />
    </Router>
  );
  const head = Head.rewind()
    .map((n) => renderToString(n))
    .join("");
  return [data, head, app];
}
