import { h } from "preact";
import glob from "fast-glob";
import { pathToFileURL } from "url";
import { resolve } from "path";
import { Router } from "wouter-preact";
import renderToString from "preact-render-to-string";
import staticLocationHook from "wouter-preact/static-location";
import { Head, createAsyncPage, App } from "muggle-client";

export async function renderToHtml(
  url: string,
  fetch: any
): Promise<[unknown, string, string]> {
  if (!url.endsWith("/")) {
    url += "/";
  }

  const items: any = {};
  const dir = "dist/.tmp/pages";
  const files = await glob(`${dir}/**/*.js`);
  for (const file of files) {
    const path = pathToFileURL(resolve(file)).toString();
    const route = file
      .substr(0, file.length - ".js".length)
      .replace(/\/index$/, "/")
      .replace(dir, "");
    items[route] = () => import(path);
  }
  const pages = Object.entries(items).map(([file, loader]) => {
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
