import cac from "cac";
import fs from "fs-extra";
import dev from "./dev";
import exportHTML from "./export";

export const store = "dist/.tmp/";

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

cli.command("serve").action(dev);

cli.command("build").action(exportHTML);

cli.parse();
