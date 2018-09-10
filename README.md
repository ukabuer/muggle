An unambitious static site generator, no magic inside.

Routes and data are defined by yourself, and connected by the template with only a few implicit rules.

## Features
- A declarative way to customize the site pages
- Lightweight and easy to use
- auto generating based on the files in directory
- Using `pug` as the templating engine
- Armed with a live reload dev server

## Install
Make sure you have `nodejs` >= 8.6.0 and `npm` installed beforehand
``` shell
npm install -g static
# or locally in a node project
npm install static
```

## Usage
Create a new site:
```
static new
```

Start the dev server:
```
static serve
```

Generate HTML files:
```
static gen
```

## Customize
First of all, you need to have a `site.json` which defines the global data including some info about site pages.

These global data can be accessed in all templates using the variable `site`.

And for each site page, if you define a data file for it in `site.json`, there will be a `page` variable contains the data.

An example for `site.json`:
``` json
{
  // can be accessed using `site.title` in all templates
  "title": "this is the site title",
  // can be accessed using `site.oh` in all templates
  "oh": "~~~~~~~",
  // required, define all pages' path, template and data
  "pages": [
    {
      // the home page
      // url path, can be accessed using `page.path` in my_template.pug
      "path": "/",
      "template": "templates_dir/my_template.pug",
      // data in this file will be merged in to `page`, can also be a markdown or yaml file
      "data": "contents_dir/my_data.json",
      // can be accessed using `page.deps`
      "deps": [
        {
          // `:filename` will be replaced with file name
          // can be accessed using `page.deps[i].path` when rendering '/'
          // can be accessed using `page.path when rendering '/blog/:filename'
          "path": "/blog/:filename/",
          // each markdown, json and yaml file in this directory will render a page
          "dir": "contents_dir/blog",
          "template": "templates_dir/article.pug"
        }
      ]
    },
    {
      // the about page
      "path": "/about/",
      "data": "contents/about.json",
      "template": "templates/about.pug"
    }
  ]
}
```

## Roadmap
- [ ] pagination
- [ ] dev middleware
- [ ] routes syntax validation
