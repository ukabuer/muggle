// from https://github.com/sveltejs/kit/blob/master/packages/kit/src/core/adapt/prerender.js
export function cleanHtml(html: string) {
  return html
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gm, "")
    .replace(/(<script[\s\S]*?>)[\s\S]*?<\/script>/gm, "$1</script>")
    .replace(/(<style[\s\S]*?>)[\s\S]*?<\/style>/gm, "$1</style>")
    .replace(/<!--[\s\S]*?-->/gm, "");
}

export function getHref(attrs: string) {
  const match =
    /(?:[\s'"]|^)href\s*=\s*(?:"(\/.*?)"|'(\/.*?)'|(\/[^\s>]*))/.exec(attrs);
  return match && (match[1] || match[2] || match[3]);
}
