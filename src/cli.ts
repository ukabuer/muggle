import cac from "cac";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import createServer from "./server.js";
import render from "./prerender.js";

export const store = "dist/.tmp/";

export const config = {
  apis: "apis",
};

function prepare() {
  fs.ensureDirSync(store);

  const templatePath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../template.html"
  );
  fs.copyFileSync(templatePath, join(store, "index.html"));

  fs.writeFileSync(
    join(store, "entry-client-template.js"),
    `import { renderToDOM } from "muggle/client";
     const items = import.meta.glob("../../pages/**/*.tsx");
     renderToDOM(items);`
  );

  fs.writeFileSync(
    join(store, "entry-server-template.js"),
    `import { renderToHtml } from "muggle/server";
     const items = import.meta.glob("../../pages/**/*.tsx");
     export default (url, template) => renderToHtml(url, items, template);`
  );
}

function mergeConfig() {
  const configPath = "muggle.config.json";
  if (!fs.existsSync(configPath)) {
    return;
  }

  try {
    const file = fs.readFileSync(configPath, "utf-8");
    const data = JSON.parse(file);
    Object.assign(config, data);
  } catch (e) {
    console.error(`Invalid muggle.config.json: ${(e as Error).message}`);
  }
}

mergeConfig();

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
