const pages = (import.meta as any).glob("../pages/**/*.tsx", { eager: true });
// const pages = {};
console.log(pages);
export async function render(url: string) {
  return Object.keys(pages).join("\n");
}
