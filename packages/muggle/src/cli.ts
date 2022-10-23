#!/usr/bin/env node
import cac from "cac";
import fs from "fs-extra";
import startExport, { compile } from "./export.js";
import { startDevServer, startBuildServer } from "./server.js";

const cli = cac();

cli.command("serve").action(async () => {
  startDevServer();
});

cli.command("build").action(async () => {
  fs.rmSync("dist", { force: true, recursive: true });
  await compile();
  const app = await startBuildServer();
  await startExport();
  app.server.close();
});

cli.parse();
