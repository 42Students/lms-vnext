export type DepartmentUsage = {
  programs: number;
  faculty: number;
  courses: number;
};

export class DepartmentHasDependenciesError extends Error {
  constructor(public readonly usage: DepartmentUsage) {
    super("Department still has active dependencies");
    this.name = "DepartmentHasDependenciesError";
  }
}

export function assertDepartmentCanArchive(usage: DepartmentUsage) {
  if (usage.programs > 0 || usage.faculty > 0 || usage.courses > 0) {
    throw new DepartmentHasDependenciesError(usage);
  }
}
