import cac from "cac";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import createServer from "./server.js";
import render from "./prerender.js";

function prepare() {
  fs.ensureDirSync("dist/.tmp");

  const templatePath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../template.html"
  );
  fs.copyFileSync(templatePath, "dist/.tmp/index.html");

  fs.writeFileSync(
    "dist/.tmp/entry-client-template.js",
    `import { renderToDOM } from "muggle-client";
     const items = import.meta.glob("../../pages/**/*.tsx");
     renderToDOM(items);`
  );

  fs.writeFileSync(
    "dist/.tmp/entry-server-template.js",
    `import { renderToHtml } from "muggle/entry-server";
     const items = import.meta.glob("../../pages/**/*.tsx");
     export default (url) => renderToHtml(url, items);`
  );
}

const cli = cac();

cli.command("serve").action(() => {
  prepare();
  createServer();
});

cli.command("build").action(() => {
  fs.rmSync("dist", { force: true, recursive: true });
  prepare();
  render();
});

cli.parse();
