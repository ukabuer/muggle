import cac from "cac";

const cli = cac();

cli.command("serve").action(() => {
  console.log("serve");
});

cli.command("render").action(() => {
  console.log("render");
});

cli.parse();
