export async function getServerSideProps(context) {
  // Redirect from /learn to /learn/courses
  context.res.writeHead(302, { Location: "/learn/courses" });
  context.res.end();
  return { props: {} };
}

export default function Learn() {
  return <></>;
}
