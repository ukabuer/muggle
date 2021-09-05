import { FunctionComponent } from "preact";
import { Head } from "muggle-client";
import Layout from "../../components/Layout/index.js";

const BlogPage: FunctionComponent = () => {
  return (
    <Layout>
      <Head>
        <title>Blog | Muggle Demo</title>
      </Head>
      <h1>Blog</h1>
    </Layout>
  );
};

export default BlogPage;
