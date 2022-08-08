import { resolve } from "path";
import { PageModule, processPages } from "./main";
import fse from "fs-extra";
import http from "http";

// from https://github.com/sveltejs/kit/blob/master/packages/kit/src/core/adapt/prerender.js
export function cleanHtml(html: string) {
  return html
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gm, "")
    .replace(/(<script[\s\S]*?>)[\s\S]*?<\/script>/gm, "$1</script>")
    .replace(/(<style[\s\S]*?>)[\s\S]*?<\/style>/gm, "$1</style>")
    .replace(/<!--[\s\S]*?-->/gm, "");
}

export function getHref(attrs: string) {
  const match =
    /(?:[\s'"]|^)href\s*=\s*(?:"(\/.*?)"|'(\/.*?)'|(\/[^\s>]*))/.exec(attrs);
  return match && (match[1] || match[2] || match[3]);
}

async function request(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(path, (resp) => {
        let data = "";

        resp.on("data", (chunk) => {
          data += chunk;
        });

        resp.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function exportHTML() {
  if (fse.existsSync("public")) {
    fse.copySync("public/", "dist/", {
      overwrite: true,
    });
  }
  const script = resolve("./dist/MUGGLE_APP.js");
  const pages = await import(script).then(
    (m) => m.AllPages as Record<string, PageModule>
  );
  const routes = Object.keys(processPages(pages)).filter(
    (route) => !route.includes(":")
  );

  const unresolved: string[] = [...routes];
  const resolved = new Set();
  while (unresolved.length > 0) {
    const url = unresolved.shift();
    if (!url || resolved.has(url)) {
      continue;
    }

    // request url & get response
    const target = `http://localhost:3000${url}`;
    const response = await request(target);
    // save to file
    // parse to find more url
    const cleaned = cleanHtml(response);

    const pattern = /<(a|link|)\s+([\s\S]+?)>/gm;
    let match = pattern.exec(cleaned);
    while (match) {
      const attrs = match[2];
      const href = getHref(attrs);
      if (
        href &&
        !href.startsWith("/assets/") &&
        !href.startsWith("/static/") &&
        !href.endsWith(".css") &&
        !href.endsWith(".js")
      ) {
        const fullUrl = new URL(href, "http://localhost:3000/");
        unresolved.push(fullUrl.pathname);
      }
      match = pattern.exec(cleaned);
    }
    resolved.add(url);
  }
}

exportHTML();
