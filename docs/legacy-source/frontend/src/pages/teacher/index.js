export async function getServerSideProps({ req }) {
  const authCookie = req.cookies?.lms_authenticated;
  if (!authCookie) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return { redirect: { destination: '/teacher/courses', permanent: false } };
}

export default function Teacher() {
  return <></>;
}
