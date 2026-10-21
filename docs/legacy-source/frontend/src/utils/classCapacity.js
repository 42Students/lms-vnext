function asCount(value) {
  // Number(null) and Number("") are 0: an unknown roster count must not read as an empty class.
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function classMaximumStudents(classRecord) {
  const raw = classRecord?.upperLimit ?? classRecord?.upper_limit ?? classRecord?.capacity ?? classRecord?.maxStudents ?? classRecord?.max_students;
  const number = Number(raw);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function classCapacityState(classRecord, studentCount) {
  const max = classMaximumStudents(classRecord);
  const count = asCount(studentCount);
  if (max == null) {
    return { known: false, count, max: null, full: false, remaining: null };
  }
  if (count == null) {
    return { known: false, count: null, max, full: false, remaining: null };
  }
  return {
    known: true,
    count,
    max,
    full: count >= max,
    remaining: Math.max(0, max - count),
  };
}
