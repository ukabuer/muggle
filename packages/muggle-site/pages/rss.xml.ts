import { ServerRenderContextData } from "muggle";

type Post = {
  title: string;
  time: string;
  link: string;
  content: string;
};

export default (
  params: Record<string, string>,
  context: ServerRenderContextData,
  data: Post[],
) => {
  return `
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>
    <![CDATA[ muggle ]]>
  </title>
  <link href="http://localhost:5173/rss.xml" rel="self"/>
  <link href="http://localhost:5173/"/>
  <updated>2023-02-24T15:53:08+01:00</updated>
  <id>http://localhost:5173/</id>
  <author>
    <name>
      <![CDATA[ ukabuer ]]>
    </name>
  </author>
  ${data.map(
    (item) => `<entry>
    <title type="html"><![CDATA[ ${item.title} ]]></title>
    <link href="${item.link}"/>
    <updated>${item.time}</updated>
    <id>${item.link}</id>
    <content type="html">${item.content}</content>
  </entry>`,
  )}
</feed>
`;
};

export async function preload(params: Record<string, string>): Promise<Post[]> {
  return [
    {
      title: "Post 1",
      time: new Date().toUTCString().toString(),
      link: "http://localhost:5173/blog/1/",
      content: "This is post 1",
    },
    {
      title: "Post 2",
      time: new Date().toUTCString().toString(),
      link: "http://localhost:5173/blog/2/",
      content: "This is post 2",
    },
  ];
}
