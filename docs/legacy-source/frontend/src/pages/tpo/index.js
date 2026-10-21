/** /tpo has no content of its own; Home is the TPO landing page. */
export async function getServerSideProps() {
  return { redirect: { destination: "/tpo/home", permanent: false } };
}

export default function TpoIndex() {
  return null;
}
