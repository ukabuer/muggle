import { h, FunctionComponent } from "preact";
import { Head } from "muggle";
import Header from "../../components/Header";

type Props = {
  page: string;
};

const PostPage: FunctionComponent<Props> = ({ page }: Props) => (
  <div>
    <Head>
      <title>Post Page</title>
    </Head>
    <Header />
    <p>Dynamic url params test.</p>
    <p>{page}</p>
  </div>
);

export async function preload(params: Record<string, string>) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("This is post " + params["post"]);
    }, 100);
  });
}

export default PostPage;
