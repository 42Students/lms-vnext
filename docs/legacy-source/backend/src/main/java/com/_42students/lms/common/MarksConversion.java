package com._42students.lms.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * One comparable percentage for a mark however it was earned (TPO notes, 5 Oct 2026). A percentage stays as it is; a CGPA or GPA
 * out of 10 is converted with the college's rule (universities publish different formulas); out of any other maximum it is
 * grade / max x 100; a letter grade has no percentage (null), and screens say so rather than treating it as failing.
 */
public final class MarksConversion {
    private MarksConversion() {}

    public static final String DEFAULT_RULE = "X9_5";
    /** Rule key -> how it reads, in the order Settings offers them. */
    public static final Map<String, String> RULES = new LinkedHashMap<>();
    static {
        RULES.put("X9_5", "CGPA x 9.5 (CBSE, AICTE)");
        RULES.put("MINUS_0_5_X10", "(CGPA - 0.5) x 10 (JNTU)");
        RULES.put("MINUS_0_75_X10", "(CGPA - 0.75) x 10 (VTU)");
        RULES.put("X10", "CGPA x 10");
    }

    public static String rule(String raw) { return raw != null && RULES.containsKey(raw) ? raw : DEFAULT_RULE; }

    /** PERCENTAGE, CGPA, GPA or GRADE from what the profile stored ("Percentage", "CGPA", "Grade", ...). */
    public static String scale(String gradingType) {
        String t = gradingType == null ? "" : gradingType.trim().toUpperCase(Locale.ROOT);
        if (t.startsWith("PERCENT") || t.equals("%")) return "PERCENTAGE";
        if (t.equals("CGPA") || t.equals("CPI") || t.equals("SGPA")) return "CGPA";
        if (t.equals("GPA")) return "GPA";
        return t.isEmpty() ? "PERCENTAGE" : "GRADE";
    }

    static BigDecimal number(String s) {
        if (s == null) return null;
        String t = s.trim().replace("%", "");
        if (t.indexOf(',') >= 0 && t.indexOf('.') < 0) t = t.replace(',', '.'); // "8,5"
        try { return new BigDecimal(t); } catch (NumberFormatException e) { return null; }
    }

    /**
     * The scale a CGPA is out of. Students often type the mark itself as the maximum ("9.3 out of 9.3") or leave it blank,
     * so only the usual 4, 5 and 10 are trusted; anything else counts as 10 when the mark fits. Null when it cannot be a CGPA.
     */
    static BigDecimal cgpaMax(BigDecimal g, String max) {
        BigDecimal m = number(max);
        if (m != null && (m.compareTo(BigDecimal.valueOf(4)) == 0 || m.compareTo(BigDecimal.valueOf(5)) == 0 || m.compareTo(BigDecimal.TEN) == 0)) {
            return g.compareTo(m) > 0 ? null : m;
        }
        return g.compareTo(BigDecimal.TEN) > 0 ? null : BigDecimal.TEN; // 86 "out of 10" is a typo, not a mark
    }

    /** The comparable percentage, or null when there is none (a letter grade, or nothing usable). */
    public static BigDecimal toPercent(String grade, String gradingType, String max, String ruleKey) {
        BigDecimal g = number(grade);
        if (g == null || g.signum() < 0) return null;
        String scale = scale(gradingType);
        // A number typed as a "Grade" (CBSE's 9, 8.6) is a grade point out of 10.
        if ("GRADE".equals(scale)) scale = g.compareTo(BigDecimal.TEN) <= 0 ? "CGPA" : "NONE";
        BigDecimal out;
        switch (scale) {
            case "PERCENTAGE" -> {
                BigDecimal m = number(max);
                if (g.compareTo(BigDecimal.valueOf(100)) <= 0) out = g;
                else if (m != null && m.compareTo(g) >= 0) out = g.multiply(BigDecimal.valueOf(100)).divide(m, 4, RoundingMode.HALF_UP); // 934 of 1000
                else return null;
            }
            case "CGPA", "GPA" -> {
                BigDecimal m = cgpaMax(g, max);
                if (m == null) return null;
                if (m.compareTo(BigDecimal.TEN) != 0) out = g.multiply(BigDecimal.valueOf(100)).divide(m, 4, RoundingMode.HALF_UP);
                else out = switch (rule(ruleKey)) {
                    case "MINUS_0_5_X10" -> g.subtract(new BigDecimal("0.5")).multiply(BigDecimal.TEN);
                    case "MINUS_0_75_X10" -> g.subtract(new BigDecimal("0.75")).multiply(BigDecimal.TEN);
                    case "X10" -> g.multiply(BigDecimal.TEN);
                    default -> g.multiply(new BigDecimal("9.5"));
                };
            }
            default -> { return null; }
        }
        if (out.compareTo(BigDecimal.valueOf(100)) > 0) out = BigDecimal.valueOf(100);
        if (out.signum() < 0) out = BigDecimal.ZERO;
        return out.setScale(2, RoundingMode.HALF_UP);
    }

    /** True when the shown mark is not already the percentage (a CGPA, a grade, or marks out of 1000). */
    public static boolean converted(String grade, String gradingType) {
        if (!"PERCENTAGE".equals(scale(gradingType))) return true;
        BigDecimal g = number(grade);
        return g != null && g.compareTo(BigDecimal.valueOf(100)) > 0;
    }

    /** A CGPA out of 10 (null when it is not one, or is a typo like 90). */
    public static BigDecimal cgpaOutOf10(String grade, String gradingType, String max) {
        if (!"CGPA".equals(scale(gradingType))) return null;
        BigDecimal g = number(grade);
        if (g == null || g.signum() < 0) return null;
        BigDecimal m = cgpaMax(g, max);
        return m != null && m.compareTo(BigDecimal.TEN) == 0 ? g : null;
    }

    /** "9.2 CGPA", "86%", "A1": the mark as earned, for display. */
    public static String shown(String grade, String gradingType, String max) {
        if (grade == null || grade.isBlank()) return null;
        String g = grade.trim();
        BigDecimal n = number(g);
        BigDecimal m = number(max);
        return switch (scale(gradingType)) {
            case "PERCENTAGE" -> n != null && n.compareTo(BigDecimal.valueOf(100)) > 0 && m != null
                    ? g + " / " + m.stripTrailingZeros().toPlainString() : g.endsWith("%") ? g : g + "%";
            case "CGPA", "GPA" -> {
                String unit = scale(gradingType);
                BigDecimal cm = n == null ? null : cgpaMax(n, max);
                yield cm != null && cm.compareTo(BigDecimal.TEN) != 0 ? g + " / " + cm.stripTrailingZeros().toPlainString() + " " + unit : g + " " + unit;
            }
            default -> g;
        };
    }
}
