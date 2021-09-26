import { h } from "preact";
import { Router } from "wouter-preact";
import renderToString from "preact-render-to-string";
import staticLocationHook from "wouter-preact/static-location";
import { Head, createAsyncPage, App, Module } from "muggle-client";
import fetch from "isomorphic-unfetch";

export async function renderToHtml(url: string, items: Record<string, () => Promise<Module>>): Promise<[unknown, string, string]> {
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
    const page = createAsyncPage(file, loader as any, (url) =>
      fetch("http://localhost:3000" + url)
    );
    return page;
  });

  const page = pages.find((page) => page.Match(url)[0]);

  let data: unknown = { error: "Not Found" };
  if (page) {
    try {
      data = await page.Load(page.Match(url)[1]);
    } catch (err: unknown) {
      data = { error: (err as Error).message };
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
  return [data, head, app];
}
