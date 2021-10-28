import { FunctionComponent } from "preact";
import { Head } from "muggle/client";
import Layout from "../components/Layout";

const ErrorPage: FunctionComponent<{ page: unknown }> = ({ page }) => {
  return (
    <Layout>
      <Head>
        <title>Error | Muggle Demo</title>
      </Head>
      <p>
        <span>there is something wrong: </span>
        {(page && (page as Record<string, string>)["error"]) || "unknown"}
      </p>
    </Layout>
  );
};

export default ErrorPage;
