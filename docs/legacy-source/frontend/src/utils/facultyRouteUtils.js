export const getFacultyBasePath = (pathname = "", facultyType = "") => {
  const normalizedFacultyType = String(facultyType || "").toUpperCase();
  if (normalizedFacultyType === "MENTOR") return "/mentor";
  const normalizedPath = String(pathname || "");
  if (normalizedPath.includes("/mentor")) return "/mentor";
  return "/teacher";
};

export const getFacultyCoursesPath = (pathname = "", facultyType = "") => `${getFacultyBasePath(pathname, facultyType)}/courses`;
