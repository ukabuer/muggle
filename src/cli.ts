#!/usr/bin/env node
import cac from "cac";
import fs from "fs-extra";
import startExport, { compile } from "./export.js";
import { startDevServer, startBuildServer } from "./server.js";

export const store = "node_modules/.muggle/";

export const config = {
  apis: "apis",
};

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
