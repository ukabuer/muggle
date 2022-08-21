// eslint-disable-next-line
// @ts-ignore
const pages = import.meta.glob("/pages/**/*.tsx", { eager: true });

// eslint-disable-next-line
// @ts-ignore
const islands = import.meta.glob("/islands/**/*.tsx", { eager: true });

export { pages, islands };
