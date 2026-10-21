import { Tabs, Result, Button } from "antd";
import {
  getClassName,
  getCourse,
  getFacultyCourse,
  getCourseBySlug,
} from "../../../api/Services/courseServices";
import AdminLayout from "@/layouts/AdminLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { courseAction } from "@/redux/store";
import AdminCourseHome from "@/components/admin/courses/AdminCourseHome";
import AdminCourseSyllabus from "@/components/admin/courses/AdminCourseSyllabus";
import { PageSkeleton } from "@/components/Common/Skeletons";

// export async function getServerSideProps(context) {
//   let data = null;
//   let error = null;

//   try {
//     data = await getFacultyCourse({courseId: context.params.id}).then(res => res.data);
//   } catch (e) {
//     error = e;
//   }
//   return { props: { data, error } };
// }

const items = [
  {
    key: "1",
    label: `Home`,
    children: <AdminCourseHome />,
  },

  {
    key: "2",
    label: `Syllabus`,
    children: <AdminCourseSyllabus />,
  },
  // {
  //   key: "3",
  //   label: `Grading`,
  //   children: <Grading />,
  // },
];

export default function CourseDetails() {
  const dispatch = useDispatch();
  const router = useRouter();
  const course = useSelector(state => state.course.currAdminCourse);
  const [loading, setLoading] = useState(true);
  // The backend's /by-slug/{slug} and /fetchCourse both already collapse "belongs to another
  // college" and "doesn't exist" into a 404 (see CourseController's own comments on those
  // endpoints) — a college-admin can't actually reach another college's course data. What was
  // missing was this page noticing that failure at all: res1 came back undefined from
  // Promise.allSettled, and the page rendered an empty-titled shell with no explanation.
  const [notFound, setNotFound] = useState(false);

  const { id } = router.query;
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    // Check if id is a slug (starts with "crs-") or numeric ID
    const isSlug = typeof id === 'string' && id.startsWith('crs-') && id.length >= 8;

    if (isSlug) {
      let promiseArray = [
        getCourseBySlug(id),
        getClassName({ courseSlug: id }),
      ];
      Promise.allSettled(promiseArray).then(
        ([r1, r2]) => {
          if (cancelled) return;
          setLoading(false);
          const res1 = r1.status === "fulfilled" ? r1.value : null;
          const res2 = r2.status === "fulfilled" ? r2.value : null;
          const courseData = res1?.data?.data;
          if (r1.status === "rejected" || !courseData?.id) {
            setNotFound(true);
            return;
          }
          dispatch(
            courseAction.setAdminCourse({
              ...courseData,
              classNames: res2?.data ?? res2,
            })
          );
        }
      );
    } else if (!isNaN(id)) {
      // Legacy numeric ID: Fetch course and redirect to slug URL
      getCourse({ courseId: parseInt(id) }).then(res => {
        if (cancelled) return;
        const course = res?.data?.data;
        if (!course?.id) {
          setLoading(false);
          setNotFound(true);
          return;
        }
        if (course?.slug) {
          // Redirect to slug URL
          const segments = router.asPath.split("/");
          const idx = segments.indexOf(id);
          if (idx !== -1) {
            segments[idx] = course.slug;
            const newPath = segments.join("/");
            if (newPath !== router.asPath) {
              router.replace(newPath, undefined, { shallow: false });
              return;
            }
          }
        }
        // No slug found, continue with legacy behavior
        const courseId = course?.id;
        const promiseArray = [
          Promise.resolve(res),
          courseId ? getClassName({ courseId }) : Promise.resolve(null),
        ];
        Promise.allSettled(promiseArray).then(
          ([{ value: res1 }, { value: res2 }]) => {
            if (cancelled) return;
            setLoading(false);
            dispatch(
              courseAction.setAdminCourse({
                ...res1?.data?.data,
                classNames: res2?.data ?? res2,
              })
            );
          }
        );
      }).catch(() => {
        if (cancelled) return;
        setLoading(false);
        setNotFound(true);
      });
    } else {
      setLoading(false);
      setNotFound(true);
    }
    return () => { cancelled = true; };
  }, [id, dispatch, router]);

  if (notFound) {
    return (
      <Result
        status="404"
        title="Course not found"
        subTitle="This course doesn't exist, was removed, or isn't available to your college."
        extra={
          <Button type="primary" onClick={() => router.push("/college-admin/courses")}>
            Back to Courses
          </Button>
        }
      />
    );
  }

  // BE-0178: the store still holds the previous course while this one loads; show it only once it is this route's course.
  const isThisCourse = Boolean(course) && (course.slug === id || String(course.id) === String(id));
  if (loading || !isThisCourse) {
    return <PageSkeleton label="Loading course details" />;
  }

  return (
    <div className="ant-tabs-dashboard">
      <div className="ln-subcourse-head bg-white">
        <h2 className="ln-lto-bold">{course?.course_name}</h2>
      </div>
      <Tabs
        defaultActiveKey="1"
        items={items}
        animated={{
          inkBar: false,
          tabPane: true,
        }}
      />
    </div>
  );
}

CourseDetails.adminLayout = AdminLayout;
