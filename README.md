An unambitious static site generator, no magic inside.

Each page's data and template are defined by yourself, and the route is derived by its file path.

__WARNING: this project is still under development.__

## Features
- Lightweight and intuitive
- Write a SSR site like writing a SPA
- SEO friendly

## Install
Make sure you have `nodejs` >= 14.0.0 and `npm` installed beforehand, then run
``` shell
npm install --save muggle
```

## Get Started
### 1. Static Route
All `*.tsx` file under directory `pages` will become a HTML file, as long as it `default` exports a valid preact component
- `pages/about/index.tsx` -> `about/index.html`
- `pages/404.tsx` -> `404.html`

Use `Head` from `muggle/client` to define something in HTML's `<head></head>` tag:
```jsx
import { Head } from 'muggle/client';

export default () => {
  return (
    <div>
      <Head>
        <title>My Page Title!</title>
      </Head>
      <h1>Hello</h1>
    </div>
  );
}
```

### 2. Load Data
Define a named export `preload` with a `async` function to populate component's prop `page`
```jsx
export default ({ page }) => {
  return (
    <div>
      <Head>
        <title>My Page Title!</title>
      </Head>
      <h1>{page}</h1>
    </div>
  );
}
// will become <h1>Hello</h1> in HTML

export async function preload(fetch) { return 'Hello'; }
// you can fetch() something from Internet here
```
Codes in `preload` function should be platform independent, it will be excuted at both server side and client side.

### 3. Dynamic Route
Surround a file or directory's name with bracket to make it a variable:
- `pages/blog/[post].tsx` -> `blog/first-post.html` & `blog/second-title.html`

You can access the variable's value in the `preload` function:
```jsx
// for `pages/blog/[post].tsx`
export async function preload(fetch, params) {
  try {
    const res = await fetch(`https://xxxx.com/blog/${params.post}`);
    return await res.json();
  } catch (err) {
    return { error: "Not Found" };
  }
}
```

Using `Link` from `muggle/client` to make links to the site:
```jsx
import { Head, Link } from 'muggle/client';

export default () => {
  return (
    <div>
      <Head>
        <title>My Page Title!</title>
      </Head>
      <div>
        <p><Link to="/blog/first-post/">First Post</Link></p>
        <p><Link to="/blog/2/">Second Post</Link></p>
      </div>
    </div>
  );
}
```

### 4. Server side logic
All `*.json.ts` files under directory `apis` will become a JSON file, as long as it `named` exports a `get` function
- `apis/blog/list.json.ts` -> `apis/blog/list.json`

You can read data from file system, or fetch something from Internet:
```jsx
import fs from 'fs';
import marked from 'marked';

export const get = async (req) => {
  const path = "/home/xxx/blog/markdowns" + req.path;
  // or fetch from Internet
  const markdown = await fs.readFile(path, 'utf8');
  return marked(markdown);
};
```

And you can access it from the `preload` function:
```jsx
export async function preload(fetch, params) {
  return fetch(`/apis/blog/${params.post}.json`);
}

export default ({ page }) => {
  return (
    <div>
      <Head>
        <title>{page.title}</title>
      </Head>
       <article dangerouslySetInnerHTML={{ __html: page.content }}></article>
    </div>
  );
}
```

## Devolop or build
Start a dev server, using `npm` script to run
```
muggle serve
```

Generate HTML files:
```
muggle build
```
