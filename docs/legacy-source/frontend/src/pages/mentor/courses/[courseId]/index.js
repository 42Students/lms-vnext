export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/mentor/projects",
      permanent: false,
    },
  };
}

export default function MentorRedirect() {
  return null;
}
