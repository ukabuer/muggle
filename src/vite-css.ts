import { PluginOption } from "vite";
import { setCSS } from "./Layout.js";

const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`;
const cssLangRE = new RegExp(cssLangs);

const isCSSRequest = (request: string): boolean => cssLangRE.test(request);

const plugin: PluginOption = {
  name: "muggle:css-post",
  async transform(css, id) {
    if (!isCSSRequest(id)) {
      return;
    }

    setCSS(id, css);
    return css;
  },
};

export default plugin;
