import cac from "cac";
import createServer from './server'
import render from './prerender'

const cli = cac();

cli.command("serve").action(() => {
  createServer();
});

cli.command("render").action(() => {
  render();
});

cli.parse();
