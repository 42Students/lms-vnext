export const numberedTeamTitle = (title) => {
  const value = String(title || "").trim();
  const match = value.match(/^(.*?)(?:\s*[-—:]?\s*)\bteam\s+(\d+)\b(.*)$/i);
  if (!match) return null;
  return {
    series: `${match[1].trim().toLowerCase()}|${match[3].trim().toLowerCase()}`,
    number: Number(match[2]),
  };
};

export const compareNumberedTeamProjects = (left, right) => {
  const a = numberedTeamTitle(left?.title);
  const b = numberedTeamTitle(right?.title);
  if (!a || !b || a.series !== b.series || !Number.isFinite(a.number) || !Number.isFinite(b.number)) {
    return 0;
  }
  return a.number - b.number;
};

export const sortNumberedTeamSeries = (projects) =>
  [...(Array.isArray(projects) ? projects : [])]
    .map((project, index) => ({ project, index }))
    .sort((a, b) => compareNumberedTeamProjects(a.project, b.project) || a.index - b.index)
    .map(({ project }) => project);
