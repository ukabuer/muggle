import { h } from "preact";
import { Router } from "wouter-preact";
import renderToString from "preact-render-to-string";
import staticLocationHook from "wouter-preact/static-location";
import fetch from "isomorphic-unfetch";
import {
  Head, createAsyncPage, App, Module, ErrorPath,
} from "./client/index.js";
import { AsyncPageType } from "./client/types.js";

async function renderToHtml(
  url: string,
  items: Record<string, () => Promise<Module>>,
  template: string,
): Promise<string> {
  if (!url.endsWith("/")) {
    // eslint-disable-next-line no-param-reassign
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
  const pages = Object.entries(files).map(([file, loader]) => createAsyncPage(file, loader, (route) => fetch(`http://localhost:3000${route}`))) as AsyncPageType<unknown>[];

  let data: unknown = null;
  let matchedPage = pages.find((page) => page.Match(url)[0]);
  if (!matchedPage) {
    // eslint-disable-next-line no-param-reassign
    url = ErrorPath;
    matchedPage = pages.find((page) => page.Match(ErrorPath)[0]);
    data = { error: "Not Found" };
  }

  if (matchedPage) {
    try {
      if (!data) {
        data = await matchedPage.Load(matchedPage.Match(url)[1]);
      } else {
        await matchedPage.LoadComponent();
      }
    } catch (err: unknown) {
      data = { error: (err && (err as Error).message) || "unknown" };
    }
  }

  const app = renderToString(
    h(Router, {
      hook: staticLocationHook(url),
      children: [h(App, { pages, initial: data })],
    }),
  );
  const head = Head.rewind()
    .map((n) => renderToString(n))
    .join("");

  let html = template.replace(
    "<!-- @HEAD@ -->",
    head
      + `<script>window.__PRELOAD_DATA__ = ${JSON.stringify(
        data || {},
      )};</script>`.trim(),
  );
  html = html.replace("<!-- @APP@ -->", app);
  return html;
}

export { renderToHtml };

export default renderToHtml;
