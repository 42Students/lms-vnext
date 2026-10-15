export function collegeStudentVisibilityAction(visible:boolean) {
  return visible?{label:"Hide from students",next:false,confirmation:"Hide this lesson content from learners? Teaching staff and admins retain access."}
    :{label:"Make visible to students",next:true,confirmation:"Show this lesson content to learners when its lesson, path and publication allow access?"};
}
