export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/mentor",
      permanent: false,
    },
  };
}

export default function MentorRedirect() {
  return null;
}
