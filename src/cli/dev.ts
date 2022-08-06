import { startServer, startCompile } from "../main";

function dev() {
  startCompile();
  setTimeout(() => {
    startServer();
  }, 1000);
}

export default dev;
