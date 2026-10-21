package com._42students.lms.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Applied Flyway migrations are immutable. With spring.flyway.validate-on-migrate on (and the legacy
 * auto-repair off), editing or deleting a migration a database has already applied stops the
 * application from starting. This test catches that in the build instead of at deploy time, using a
 * checked-in manifest (src/test/resources/db/migration-manifest.sha256) so it needs no CI service
 * beyond `mvn test` (GitHub Actions is not relied on).
 *
 * To add a migration: create it (scripts/next_migration.py), then run
 * scripts/update_migration_manifest.py to record it. Existing entries can never be rewritten.
 */
class MigrationManifestTest {
    private static final Path DIR = Path.of("src/main/resources/db/migration");
    private static final Path MANIFEST = Path.of("src/test/resources/db/migration-manifest.sha256");
    private static final Pattern NAME = Pattern.compile("^V(\\d+)__.+\\.sql$");

    private static String sha256(Path file) throws Exception {
        // LF-normalised, like Flyway's own checksum, so Windows and Linux checkouts agree.
        String text = new String(Files.readAllBytes(file), StandardCharsets.UTF_8).replace("\r\n", "\n");
        StringBuilder hex = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8))) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    private static Map<String, String> manifest() throws IOException {
        Map<String, String> entries = new HashMap<>();
        for (String line : Files.readAllLines(MANIFEST, StandardCharsets.UTF_8)) {
            if (line.isBlank() || line.startsWith("#")) continue;
            String[] parts = line.trim().split("\\s+", 2);
            entries.put(parts[1].trim(), parts[0]);
        }
        return entries;
    }

    @Test
    void everyRecordedMigrationIsUnchangedAndStillPresent() throws Exception {
        List<String> problems = new ArrayList<>();
        for (Map.Entry<String, String> entry : manifest().entrySet()) {
            Path file = DIR.resolve(entry.getKey());
            if (!Files.exists(file)) {
                problems.add(entry.getKey() + " was deleted or renamed");
            } else if (!sha256(file).equals(entry.getValue())) {
                problems.add(entry.getKey() + " was edited");
            }
        }
        assertTrue(problems.isEmpty(),
                "Applied migrations must not change (startup validation would fail): " + problems
                        + ". Add a new migration instead of editing an old one.");
    }

    @Test
    void everyMigrationFileIsRecordedInTheManifest() throws Exception {
        Map<String, String> recorded = manifest();
        List<String> missing = new ArrayList<>();
        try (Stream<Path> files = Files.list(DIR)) {
            files.map(p -> p.getFileName().toString())
                    .filter(n -> NAME.matcher(n).matches() && !recorded.containsKey(n))
                    .sorted().forEach(missing::add);
        }
        assertTrue(missing.isEmpty(),
                "Migration(s) not recorded in the manifest: " + missing
                        + ". Run: python scripts/update_migration_manifest.py");
    }
}
