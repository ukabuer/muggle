const getAndRemoveConfig = (str) => {
  const config = {};
  let title = '';
  if (str) {
    title = str
      .replace(/:([\w-]+)=?([\w-]+)?/g, (m, key, value) => {
        config[key] = (value && value.replace(/&quot;/g, '')) || true;
        return '';
      })
      .trim();
  }
  return { title, config };
};

const isAbsolutePath = p => /(:|(\/{2}))/g.test(p);

module.exports = {
  markdown: {
    link: (href, str = '', text) => {
      let attrs = '';
      const { title } = getAndRemoveConfig(str);
      if (isAbsolutePath(href)) {
        attrs += ' target="_blank"';
      }
      if (title) {
        attrs += ` title="${title}"`;
      }
      return `<a href="${href}"${attrs}>${text}</a>`;
    },
    image: (href, str, text) => {
      let attrs = '';
      const { title, config } = getAndRemoveConfig(str);
      if (title) {
        attrs += ` title="${title}"`;
      }
      const { size } = config;
      if (size) {
        const sizes = size.split('x');
        if (sizes[1]) {
          attrs += ` width=${sizes[0]} height=${sizes[1]}`;
        } else {
          attrs += ` width=${sizes[0]}`;
        }
      }
      return `<img src="${href}" alt="${text}"${attrs}>`;
    },
  },
};
