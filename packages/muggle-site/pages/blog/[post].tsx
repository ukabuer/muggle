import { h, FunctionComponent } from "preact";
import { Head } from "muggle";
import Layout from "../../components/Layout";

type Props = {
  page: string;
};

const PostPage: FunctionComponent<Props> = ({ page }: Props) => (
  <Layout>
    <Head>
      <title>Post Page</title>
    </Head>
    <p>Dynamic url params test.</p>
    <p>{page}</p>
  </Layout>
);

export async function preload(params: Record<string, string>) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`This is post ${params["post"]}`);
    }, 100);
  });
}

export default PostPage;
