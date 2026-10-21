export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/teacher/courses",
      permanent: false,
    },
  };
}

export default function TeacherFileExplorerRedirect() {
  return null;
}
