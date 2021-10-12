import { FunctionComponent } from "preact";
import { Head } from "muggle/client";
import Layout from "../../components/Layout";

type ArticleList = Array<{
  title: string;
}>;

const BlogPage: FunctionComponent<{
  page: ArticleList;
}> = ({ page }) => {
  return (
    <Layout>
      <Head>
        <title>Blog | Muggle Demo</title>
      </Head>
      <h1>Blog</h1>
      <div>
        {page.map((article) => (
          <p>{article.title}</p>
        ))}
      </div>
    </Layout>
  );
};

type APIResult = {
  total: number,
  list: ArticleList;
};

export const preload = async (fetch: typeof window.fetch) => {
  const request = await fetch("/api/index.json");
  const data = (await request.json()) as APIResult;
  return data.list;
};

export default BlogPage;
