export async function getServerSideProps(context) {
  // Redirect from /college-admin to /college-admin/dashboard
  context.res.writeHead(302, { Location: "/college-admin/dashboard" });
  context.res.end();
  return { props: {} };
}

export default function Admin() {
  return <></>;
}
