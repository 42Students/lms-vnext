import { useRouter } from "next/router";
import { useEffect } from "react";

// export async function getServerSideProps(context) {
//   // Redirect from /admin to /admin/courses
//   context.res.writeHead(302, { Location: `${context.resolvedUrl}/Home` });
//   context.res.end();
//   return { props: {} };
// }

export default function ContactDetails() {
  const route = useRouter();
  useEffect(() => {
    if (route.isReady) {
      route.replace("/teacher/contacts/allContacts");
    }
  }, [route.isReady]);
  return <></>;
}
