package com._42students.lms.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Flyway numbering must stay one unbroken line. lms-dev-2026 and prod-2026 share these numbers, and
 * a hole (a version missing below the highest) is silently skipped by a database that has already
 * moved past it - that is how dev ended up with V163 applied and V159-V162 never run.
 *
 * Cross-branch checks live in scripts/check_migration_parity.py (needs git history); this test
 * covers what a single checkout can prove.
 */
class MigrationNumberingTest {
    private static final Path DIR = Path.of("src/main/resources/db/migration");
    private static final Pattern NAME = Pattern.compile("^V(\\d+)__[A-Za-z0-9_]+\\.sql$");
    /** Holes that predate this rule and are already applied everywhere; nothing else may be missing. */
    private static final Set<Integer> GRANDFATHERED_GAPS = Set.of(53, 54, 71, 72);

    private static List<Path> sqlFiles() throws IOException {
        try (Stream<Path> files = Files.list(DIR)) {
            List<Path> list = new ArrayList<>();
            files.filter(p -> p.getFileName().toString().endsWith(".sql")).forEach(list::add);
            return list;
        }
    }

    @Test
    void everyMigrationFileNameIsWellFormed() throws IOException {
        for (Path file : sqlFiles()) {
            assertTrue(NAME.matcher(file.getFileName().toString()).matches(),
                    "Malformed migration name (expected V<number>__snake_case.sql): " + file.getFileName());
        }
    }

    @Test
    void everyVersionNumberIsUsedByExactlyOneFile() throws IOException {
        Map<Integer, String> seen = new HashMap<>();
        for (Path file : sqlFiles()) {
            Matcher m = NAME.matcher(file.getFileName().toString());
            if (!m.matches()) continue;
            int version = Integer.parseInt(m.group(1));
            String previous = seen.put(version, file.getFileName().toString());
            assertEquals(null, previous, "V" + version + " is used by two files: " + previous + " and " + file.getFileName());
        }
    }

    @Test
    void noVersionIsMissingBelowTheHighest() throws IOException {
        Set<Integer> versions = new TreeSet<>();
        for (Path file : sqlFiles()) {
            Matcher m = NAME.matcher(file.getFileName().toString());
            if (m.matches()) versions.add(Integer.parseInt(m.group(1)));
        }
        int highest = ((TreeSet<Integer>) versions).last();
        List<Integer> missing = new ArrayList<>();
        for (int v = ((TreeSet<Integer>) versions).first(); v < highest; v++) {
            if (!versions.contains(v) && !GRANDFATHERED_GAPS.contains(v)) missing.add(v);
        }
        assertTrue(missing.isEmpty(),
                "Missing migration version(s) " + missing + " below V" + highest
                        + ". Merge the other branch (prod-2026 <-> lms-dev-2026) or renumber; use scripts/next_migration.py.");
    }
}
