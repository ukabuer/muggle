An unambitious static site generator, no magic inside.

Each page's data and template are defined by yourself, and the route is derived by its file path.

__WARNING: this project is still under development.__

## Features
- Lightweight and easy to learn
- An intuitive way to customize pages by leveraging the power of `markdown`
- Auto generating based on `.md` files in the directory
- Using `pug` as the templating engine
- Armed with a live reload dev server

## Install
Make sure you have `nodejs` >= 7.6.0 and `npm` installed beforehand
``` shell
npm install -g muggle
# or locally in a node project
npm install muggle
```

## Command line usage
Check out available commands and options with
```
muggle --help
muggle [command] --help
```

Create a new site:
```
muggle new <name>
```

Start the dev server:
```
muggle serve
```

Generate HTML files:
```
muggle build
```

## Customize
First of all, you need to have a `muggle.config.js` which defines the `pages`, `templates` and `public` variable.

`pages` indicates the directory where your `.md` files located, `templates` should be the directory contains your template files and `public` is the target directory when genrating HTML files.

Each `.md` file will generate a `.html` file，using the template and data defined in its `FrontMatter`, for example, we have a `about/index.md`:
```md
---
title: About
mydata: 1234
template: about.pug
---

Hello here!!
```

which becomes the data of page as
``` json
{
  "title": "About",
  "mydata": 1234,
  "template": "about.pug",
  "content": "<p>Hello here!!</p>"
}
```

this page will be rendered to `about/index.html` using the template `about.pug` in the theme's `template` folder, the other data in front matter will be wrapped in the `page` variable for using in the template, the markdown's content will be rendered into HTML and can be accessed using `page.content`.

If you want to define same global data, using a `site` variable in the `muggle.config.js` so it can be accessed in all templates using the name `site`.

An example for `muggle.config.js`:
``` js
module.exports = {
  pages: './pages',
  theme: './themes/my-theme', // will use templates under the theme's `templates` folder
  public: './public',
  site: {
    title: 'Muggle Example Site', // can be accessed using `site.title` in all templates
    link: 'https://ukabuer.me',
    navs: [
      { path: '/', name: 'Home' },
      { path: '/blog/', name: 'Blogs' },
      { path: '/about/', name: 'About' },
      { path: '/rss.xml', name: 'RSS' },
    ],
  },
};
```

## Roadmap
- [x] RSS
- [ ] Pagination
- [ ] Integrate scripts and styles building pipeline
- [ ] Directive system
