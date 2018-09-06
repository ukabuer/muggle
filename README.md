An unambitious static site generator, no magic inside.

Define your routes and data, then connect the two with your templates.

no implit rules,

`site.json`, define the global site data, accessing with variable `site`
``` json
{
  "title": "this is the site title",
  "routes": [
    {
      "path": "/",
      "data": "contents/my_data.json",
      "template": "templates/my_template.pug",
      "deps": [
        {
          "path": "/:filename/",
          "dir": "contents/blog",
          "template": "templates/"
        }
      ]
    },
    {
      "path": "/about/",
      "data": "contents/about.json",
      "template": "templates/my_template.pug",
    }
  ]
}
```

`my_data.json`, can be accessing with variable `data`
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
