import { startServer, startCompile } from "../main";

async function dev() {
  await startCompile();
  startServer();
}

export default dev;
