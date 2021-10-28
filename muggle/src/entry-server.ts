import { h } from "preact";
import { Router } from "wouter-preact";
import renderToString from "preact-render-to-string";
import staticLocationHook from "wouter-preact/static-location";
import { Head, createAsyncPage, App, Module, ErrorPath } from "muggle-client";
import fetch from "isomorphic-unfetch";

export async function renderToHtml(
  url: string,
  items: Record<string, () => Promise<Module>>,
  template: string
): Promise<string> {
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
    return createAsyncPage(file, loader, (url) =>
      fetch("http://localhost:3000" + url)
    );
  });

  let data: unknown = null;
  let page = pages.find((page) => page.Match(url)[0]);
  if (!page) {
    url = ErrorPath;
    page = pages.find((page) => page.Match(ErrorPath)[0]);
    data = { error: "Not Found" };
  }

  if (page) {
    try {
      if (!data) {
        data = await page.Load(page.Match(url)[1]);
      } else {
        await page.LoadComponent();
      }
    } catch (err: unknown) {
      data = { error: (err && (err as Error).message) || "unknown" };
    }
  }

  const app = renderToString(
    h(Router, {
      hook: staticLocationHook(url),
      children: [h(App, { pages, initial: data })],
    })
  );
  const head = Head.rewind()
    .map((n) => renderToString(n))
    .join("");

  let html = template.replace(
    "<!-- @HEAD@ -->",
    head +
      `<script>window.__PRELOAD_DATA__ = ${JSON.stringify(
        data || {}
      )};</script>`.trim()
  );
  html = html.replace(`<!-- @APP@ -->`, app);
  return html;
}
