import { h, FunctionComponent } from "preact";
import Head from "muggle/client";
import Counter from "../islands/Counter";

type Props = {
  page: string;
};

const IndexPage: FunctionComponent<Props> = ({ page }: Props) => (
  <div>
    <Head>
      <title>Index Page</title>
    </Head>
    <ul>
      <li>
        <a href="/">Index</a>
      </li>
      <li>
        <a href="/about/">About</a>
      </li>
      <li>
        <a href="/blog/1/">Post 1</a>
      </li>
      <li>
        <a href="/blog/2/">Post 2</a>
      </li>
    </ul>
    <h1>Index Page</h1>
    <p>{page}</p>
    <Counter initial={100} />
  </div>
);

export async function preload() {
  return "Hello world";
}

export default IndexPage;
