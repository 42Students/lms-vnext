package com._42students.lms.configuration;

import org.junit.jupiter.api.Test;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

/** Guards matcher precedence; functional HTTP role tests are also required. */
class ModuleAccessRouteSecurityContractTest {
    @Test
    void moduleManagementRulePrecedesGeneralAdminAndAuthenticatedFallback() throws Exception {
        String config = Files.readString(Path.of(
                "src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java"),
                StandardCharsets.UTF_8);
        int exclusive = config.indexOf(
                ".antMatchers(\"/api/v1/admin/module-access\", \"/api/v1/admin/module-access/**\")");
        int general = config.indexOf(".antMatchers(\"/api/v1/admin/**\")");
        int fallback = config.indexOf(".antMatchers(\"/api/v1/**\")");
        assertTrue(exclusive > 0, "Module Access must match its root and child routes");
        assertTrue(general > exclusive, "General admin must not shadow Module Access");
        assertTrue(fallback > general, "Authenticated fallback must not shadow Module Access");
        assertTrue(config.substring(exclusive, general).contains(".hasRole(\"SUPER_ADMIN\")"));
    }
}
