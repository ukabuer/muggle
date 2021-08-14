import { FunctionComponent } from "preact";
import { Head } from "muggle/client";
import Layout from "../components/Layout";

const HomePage: FunctionComponent = () => {
  return (
    <Layout>
      <Head>
        <title>Home | Muggle Demo</title>
      </Head>
      <h1>Home</h1>
    </Layout>
  );
};

export default HomePage;
