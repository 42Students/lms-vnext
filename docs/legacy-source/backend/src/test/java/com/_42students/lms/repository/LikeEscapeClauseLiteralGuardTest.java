package com._42students.lms.repository;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards a bug that no H2-backed test can see and that took the learner "My projects" page down in
 * production on 2026-09-21.
 *
 * MySQL reads a backslash inside a quoted string as an escape character. A query that reaches the
 * driver containing {@code ESCAPE '\'} therefore has a string that never closes: the driver treats
 * the closing quote as escaped, stops recognising every {@code ?} after it, and fails at bind time
 * with "Parameter index out of range (11 > number of parameters, which is 10)". That surfaced as an
 * HTTP 500 on GET /api/v1/projects/me/page, and the same pattern was in the admin project list, the
 * admin jobs search and the placement applicant search.
 *
 * The trap is that the Java source looks right. {@code "ESCAPE '\\'"} is a perfectly natural thing to
 * write, but Java turns it into a single backslash. It has to be {@code "ESCAPE '\\\\'"} (two
 * backslashes reach MySQL, which reads them as one backslash character), or use a non-backslash
 * escape character.
 *
 * This test looks at the runtime value of every string literal in main code, so it catches both
 * {@code @Query} annotations and JPQL assembled in services. It cannot prove a query is correct.
 * MySqlRepositoryQueriesIT executes the repository queries against a real MySQL for that.
 */
class LikeEscapeClauseLiteralGuardTest {
    private static final String BS = String.valueOf((char) 92);

    /** A Java string literal: opening quote, then non-quote/non-backslash chars or backslash pairs. */
    private static final Pattern JAVA_STRING_LITERAL = Pattern.compile("\"(?:[^\"" + BS + BS + "\\r\\n]|" + BS + BS + ".)*\"");

    /** ESCAPE, a quote, an ODD number of backslashes, a quote: the string never closes in MySQL. */
    private static final Pattern ODD_BACKSLASH_ESCAPE =
            Pattern.compile("ESCAPE\\s+'(?:" + BS + BS + BS + BS + ")*" + BS + BS + "'");

    private static final Pattern ANY_ESCAPE_CLAUSE = Pattern.compile("ESCAPE\\s+'");

    private static String unescapeJava(String literalBody) {
        StringBuilder out = new StringBuilder(literalBody.length());
        for (int i = 0; i < literalBody.length(); i++) {
            char c = literalBody.charAt(i);
            if (c == (char) 92 && i + 1 < literalBody.length()) {
                char next = literalBody.charAt(++i);
                out.append(next == 'n' ? '\n' : next == 't' ? '\t' : next);
            } else {
                out.append(c);
            }
        }
        return out.toString();
    }

    private static boolean isCommentLine(String line) {
        String t = line.trim();
        return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
    }

    @Test
    void noStringLiteralSendsALoneBackslashAsAnEscapeClause() throws IOException {
        Path root = Paths.get("src", "main", "java");
        List<Path> sources;
        try (Stream<Path> walk = Files.walk(root)) {
            sources = walk.filter(p -> p.toString().endsWith(".java")).collect(Collectors.toList());
        }

        List<String> offenders = new ArrayList<>();
        int escapeClausesSeen = 0;
        for (Path source : sources) {
            String content = new String(Files.readAllBytes(source), StandardCharsets.UTF_8);
            String[] lines = content.split("\\r?\\n", -1);
            for (int n = 0; n < lines.length; n++) {
                if (isCommentLine(lines[n])) {
                    continue;
                }
                Matcher literal = JAVA_STRING_LITERAL.matcher(lines[n]);
                while (literal.find()) {
                    String body = unescapeJava(literal.group().substring(1, literal.group().length() - 1));
                    Matcher any = ANY_ESCAPE_CLAUSE.matcher(body);
                    while (any.find()) {
                        escapeClausesSeen++;
                    }
                    if (ODD_BACKSLASH_ESCAPE.matcher(body).find()) {
                        offenders.add(root.relativize(source).toString().replace('\\', '/') + ":" + (n + 1));
                    }
                }
            }
        }

        // A scanner that quietly finds nothing would make this guard pass vacuously.
        assertTrue(sources.size() > 100, "expected to scan the main sources, found " + sources.size());
        assertTrue(escapeClausesSeen >= 5, "expected to see the existing LIKE ... ESCAPE clauses, saw " + escapeClausesSeen);
        assertTrue(offenders.isEmpty(),
                "ESCAPE '<one backslash>' reaches MySQL as an escaped quote and hides every later ? placeholder "
                        + "(fails with 'Parameter index out of range'). In Java source write four backslashes "
                        + "(ESCAPE '\\\\\\\\'), or pick a non-backslash escape character. Offenders: " + offenders);
    }
}
