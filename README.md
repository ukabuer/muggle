An unambitious static site generator, no magic inside.


Routes and data are defined by yourself, then connected by the templates, no implicit rules.


`site.json`, define the global data, can be accessed in all templates using variable `site`.
And for each site page, there will be a `page` variable contains data you defined.
``` json
{
  // can be accessed using `site.title` in all templates
  "title": "this is the site title",
  // can be accessed using `site.oh` in all templates
  "oh": "~~~~~~~",
  // required, define all pages' path, template and data
  "routes": [
    {
      // url path, can be accesed using `page.path` in my_template.pug
      "path": "/",
      "template": "templates_dir/my_template.pug",
      // data in this file will be merged in to `page`
      "data": "contents_dir/my_data.json",
      // can be accessed using `page.deps`
      "deps": [
        {
          // `:filename` with be replace with file name
          "path": "/blog/:filename/",
          // each markdown, json and yaml file in this directory will render a page
          "dir": "contents_dir/blog",
          "template": "templates_dir/article.pug"
        }
      ]
    },
    {
      "path": "/about/",
      "data": "contents/about.json",
      "template": "templates/about.pug",
    }
  ]
}
```

`contents/my_data.json`, 
``` json
{
  "title": "",
  "slogan": "An unambitious static site generator, no magic inside"
}
```

`contents/blog/article1.md`, markdown files are also data files, `html` can be accessed with `data.content`
```
{
  "title": "",
  "slogan": "An unambitious static site generator, no magic inside"
}
```

`my_template.pug`,
``` pug
html
  head
    title= site.title
  body
    h1= data.title
    h2= data.slogan
    each dep in data.deps
      h3
        a(href=dep.path)= dep.data.title
```

## Features

## Roadmap
- [ ] pagination
- [ ] routes syntax validation
