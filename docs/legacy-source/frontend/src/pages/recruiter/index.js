/** /hr has no content of its own; Home is the recruiter landing page. */
export async function getServerSideProps() {
  return { redirect: { destination: "/recruiter/home", permanent: false } };
}

export default function RecruiterIndex() {
  return null;
}
