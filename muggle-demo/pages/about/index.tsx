import { FunctionComponent } from "preact";
import { Head } from "muggle-client";
import Layout from "../../components/Layout";

const AboutPage: FunctionComponent = () => {
  return (
    <Layout>
      <Head>
        <title>About | Muggle Demo</title>
      </Head>
      <h1>About</h1>
    </Layout>
  );
};

export default AboutPage;
