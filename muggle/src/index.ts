import cac from "cac";
import createServer from "./server.js";
import render from "./prerender.js";

const cli = cac();

cli.command("serve").action(() => {
  createServer();
});

cli.command("build").action(() => {
  render();
});

cli.parse();
