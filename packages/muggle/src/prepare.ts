import fs from "fs/promises";
import { resolve } from "path";

export function getTemplateHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head><!-- HEAD --></head>
  <body>
    <main></main>
    <script type="module" src="/dist/.temp/entry-client.js"></script>
  </body>
</html>
  `.trim();
}

export async function createEntryHtml(path: string) {
  const html = getTemplateHTML();
  return fs.writeFile(path, html);
}

export async function createEntryScripts(dir: string) {
  const entryServerPath = resolve(dir, "entry-server.js");
  const writeEntryServer = fs.writeFile(
    entryServerPath,
    `
import createRenderer from "muggle/render";
export const islands = import.meta.glob("/islands/**/*.{tsx,jsx,ts,js}", { eager: true });
export const pages = import.meta.glob("/pages/**/*.{tsx,jsx,ts,js}", { eager: true });
export const render = createRenderer(pages, islands);
    `.trim(),
  );

  const entryClientPath = resolve(dir, "entry-client.js");
  const writeEntryClient = fs.writeFile(
    entryClientPath,
    `
import { hydrate, enablePJAX } from "muggle";
const islands = import.meta.glob("/islands/**/*.{tsx,jsx}", { eager: true });
hydrate(islands);
enablePJAX(islands);
    `.trim(),
  );

  await Promise.all([writeEntryServer, writeEntryClient]);

  return { server: entryServerPath, client: entryClientPath };
}
