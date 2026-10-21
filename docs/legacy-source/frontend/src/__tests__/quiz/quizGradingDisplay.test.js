/**
 * Unit tests for quiz grading display utilities.
 * These mirror the logic in submissondata.js for parsing and comparing answers.
 */

function parseMultipleValue(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return [...val].map(String);
  const str = String(val).trim();
  if (str.startsWith("[")) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {
      /* fall through to comma-split */
    }
  }
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

function normalizeMultipleValue(val) {
  return parseMultipleValue(val).sort();
}

function isMultipleAnswerCorrect(selected, correct) {
  const a = normalizeMultipleValue(selected);
  const b = normalizeMultipleValue(correct);
  if (a.length !== b.length) return false;
  return a.every((v, idx) => v === b[idx]);
}

function formatAnswer(val) {
  if (val == null || val === "") return "—";
  if (Array.isArray(val)) return val[0] ?? val.join(", ") ?? "—";
  return String(val);
}

describe("quiz grading display utilities", () => {
  describe("parseMultipleValue", () => {
    test("returns empty array for null/undefined", () => {
      expect(parseMultipleValue(null)).toEqual([]);
      expect(parseMultipleValue(undefined)).toEqual([]);
    });

    test("returns array as-is (stringified)", () => {
      expect(parseMultipleValue(["A", "B"])).toEqual(["A", "B"]);
      expect(parseMultipleValue(["Yes, please"])).toEqual(["Yes, please"]);
    });

    test("parses JSON array string", () => {
      expect(parseMultipleValue('["A","C"]')).toEqual(["A", "C"]);
      expect(parseMultipleValue('["Yes, please"]')).toEqual(["Yes, please"]);
    });

    test("falls back to comma-split for non-JSON", () => {
      expect(parseMultipleValue("A,C")).toEqual(["A", "C"]);
      expect(parseMultipleValue("A, B , C")).toEqual(["A", "B", "C"]);
    });

    test("empty string returns empty array", () => {
      expect(parseMultipleValue("")).toEqual([]);
    });

    test("whitespace-only returns empty array after trim", () => {
      expect(parseMultipleValue("   ").filter(Boolean)).toEqual([]);
    });

    test("malformed JSON falls back to comma-split", () => {
      expect(parseMultipleValue("[invalid").length).toBeGreaterThan(0);
    });
  });

  describe("normalizeMultipleValue", () => {
    test("sorts arrays consistently", () => {
      expect(normalizeMultipleValue(["C", "A", "B"])).toEqual(["A", "B", "C"]);
      expect(normalizeMultipleValue(["A", "C"])).toEqual(["A", "C"]);
    });
  });

  describe("isMultipleAnswerCorrect", () => {
    test("exact match returns true", () => {
      expect(isMultipleAnswerCorrect(["A", "C"], ["A", "C"])).toBe(true);
      expect(isMultipleAnswerCorrect("A,C", "A,C")).toBe(true);
      expect(isMultipleAnswerCorrect('["A","C"]', ["A", "C"])).toBe(true);
    });

    test("different order but same set returns true", () => {
      expect(isMultipleAnswerCorrect(["C", "A"], ["A", "C"])).toBe(true);
    });

    test("missing option returns false", () => {
      expect(isMultipleAnswerCorrect(["A"], ["A", "C"])).toBe(false);
    });

    test("extra option returns false", () => {
      expect(isMultipleAnswerCorrect(["A", "B", "C"], ["A", "C"])).toBe(false);
    });

    test("wrong option returns false", () => {
      expect(isMultipleAnswerCorrect(["A", "B"], ["A", "C"])).toBe(false);
    });

    test("empty vs non-empty returns false", () => {
      expect(isMultipleAnswerCorrect([], ["A"])).toBe(false);
      expect(isMultipleAnswerCorrect(["A"], [])).toBe(false);
    });

    test("both empty returns true", () => {
      expect(isMultipleAnswerCorrect([], [])).toBe(true);
    });

    test("handles comma in option text when using JSON format", () => {
      expect(isMultipleAnswerCorrect('["Yes, please"]', ["Yes, please"])).toBe(true);
    });
  });

  describe("formatAnswer", () => {
    test("null/undefined/empty returns em dash", () => {
      expect(formatAnswer(null)).toBe("—");
      expect(formatAnswer(undefined)).toBe("—");
      expect(formatAnswer("")).toBe("—");
    });

    test("array returns first element or joined", () => {
      expect(formatAnswer(["Paris"])).toBe("Paris");
      expect(formatAnswer(["A", "B"])).toBe("A");
    });

    test("string returns as-is", () => {
      expect(formatAnswer("Paris")).toBe("Paris");
      expect(formatAnswer("Option A")).toBe("Option A");
    });

    test("number coerced to string", () => {
      expect(formatAnswer(42)).toBe("42");
    });
  });
});
