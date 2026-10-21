package com._42students.lms.security;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Walks EVERY request mapping of every controller in the codebase and proves the recruiter fence denies
 * all of them except the recruiter API, public endpoints and a named list of session endpoints. A
 * controller added in the future is covered automatically: if it is not under /api/v1/recruiter, a recruiter
 * token cannot reach it. If a legitimate new recruiter-facing auth endpoint is needed, it must be added to
 * both RecruiterFenceFilter.ALLOWED_EXACT and EXPECTED_HR_AUTH_ENDPOINTS below, deliberately.
 */
class RecruiterFenceSweepTest {

    /** Non-recruiter-API endpoints a recruiter token may call (session lifecycle and the account switcher). */
    private static final Set<String> EXPECTED_RECRUITER_AUTH_ENDPOINTS = Set.of(
            "/api/v1/auth/refresh",
            "/api/v1/auth/refresh-cookie",
            "/api/v1/auth/logout",
            "/api/v1/auth/logout-cookie",
            "/api/v1/auth/handoff/consume",
            "/api/v1/auth/memberships",
            "/api/v1/auth/switch",
            "/api/v1/auth/switch-token",
            "/api/v1/auth/sessions",
            "/api/v1/auth/sessions/1",
            "/api/v1/client-errors/report"
    );

    private static Set<String> mappedPaths;

    @BeforeAll
    static void collectAllMappings() throws Exception {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        scanner.addIncludeFilter(new AnnotationTypeFilter(Controller.class));
        Set<String> paths = new TreeSet<>();
        for (BeanDefinition candidate : scanner.findCandidateComponents("com._42students")) {
            Class<?> type = Class.forName(candidate.getBeanClassName());
            RequestMapping classMapping = AnnotatedElementUtils.findMergedAnnotation(type, RequestMapping.class);
            List<String> bases = classMapping != null ? pathsOf(classMapping) : List.of("");
            for (Method method : type.getDeclaredMethods()) {
                RequestMapping methodMapping = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
                if (methodMapping == null) continue;
                for (String base : bases) {
                    for (String sub : pathsOf(methodMapping)) {
                        paths.add(concrete(join(base, sub)));
                    }
                }
            }
        }
        mappedPaths = paths;
    }

    private static List<String> pathsOf(RequestMapping mapping) {
        List<String> out = new ArrayList<>();
        for (String p : mapping.path()) out.add(p);
        for (String p : mapping.value()) if (!out.contains(p)) out.add(p);
        if (out.isEmpty()) out.add("");
        return out;
    }

    private static String join(String base, String sub) {
        String a = base == null ? "" : base.trim();
        String b = sub == null ? "" : sub.trim();
        if (!a.isEmpty() && !a.startsWith("/")) a = "/" + a;
        if (!b.isEmpty() && !b.startsWith("/")) b = "/" + b;
        if (a.endsWith("/") && b.startsWith("/")) a = a.substring(0, a.length() - 1);
        String joined = a + b;
        return joined.isEmpty() ? "/" : joined;
    }

    /** Replace every {variable} (including {id:regex}) with a concrete segment. */
    private static String concrete(String pattern) {
        return pattern.replaceAll("\\{[^/]*}", "1").replace("/**", "/x").replace("/*", "/x");
    }

    private static boolean isRecruiterApi(String path) {
        return path.equals("/api/v1/recruiter") || path.startsWith("/api/v1/recruiter/");
    }

    private static boolean isPublic(String path) {
        return path.startsWith("/api/v1/public/");
    }

    @Test
    void scanFoundTheWholeApi() {
        // Sanity: the scan must see hundreds of endpoints, including the recruiter API itself.
        assertTrue(mappedPaths.size() > 300, "only " + mappedPaths.size() + " mappings found");
        assertTrue(mappedPaths.contains("/api/v1/recruiter/me"));
        // The old /api/v1/hr address is gone (HR -> recruiter rename, docs/naming): nothing answers there and the fence refuses it.
        assertFalse(mappedPaths.stream().anyMatch((x) -> x.startsWith("/api/v1/hr")));
        assertFalse(RecruiterFenceFilter.isAllowedForRecruiter("/api/v1/hr/me"));
        assertTrue(mappedPaths.contains("/api/v1/superadmin/recruiters"));
    }

    @Test
    void everyEndpointOutsideTheRecruiterSurfaceIsDeniedToRecruiter() {
        List<String> leaked = mappedPaths.stream()
                .filter(path -> RecruiterFenceFilter.isAllowedForRecruiter(path))
                .filter(path -> !isRecruiterApi(path) && !isPublic(path) && !EXPECTED_RECRUITER_AUTH_ENDPOINTS.contains(path))
                .collect(Collectors.toList());
        assertTrue(leaked.isEmpty(), "HR tokens could reach: " + leaked);
    }

    @Test
    void theRecruiterSurfaceIsReachable() {
        for (String path : mappedPaths) {
            if (isRecruiterApi(path)) {
                assertTrue(RecruiterFenceFilter.isAllowedForRecruiter(path), path);
            }
        }
        for (String path : EXPECTED_RECRUITER_AUTH_ENDPOINTS) {
            assertTrue(mappedPaths.contains(path), "allowlisted endpoint no longer exists: " + path);
            assertTrue(RecruiterFenceFilter.isAllowedForRecruiter(path), path);
        }
    }

    @Test
    void sensitiveEndpointsAreDenied() {
        for (String path : List.of(
                "/api/v1/superadmin/recruiters", "/api/v1/superadmin/recruiters/1", "/api/v1/superadmin/users/faculty-admins",
                "/api/v1/admin/module-access/tree", "/api/v1/learner/getAll", "/api/v1/auth/revoke-sessions",
                "/api/v1/auth/superadmin/scope", "/api/v1/profile/learner/1", "/api/v1/assignment/submit",
                "/users/login", "/users/verifyOTP")) {
            assertFalse(RecruiterFenceFilter.isAllowedForRecruiter(path), path);
        }
    }

    @Test
    void pathTricksAreDenied() {
        for (String path : java.util.Arrays.asList(
                "/api/v1/recruiter/../admin/module-access", "/api/v1/recruiter/..%2fadmin", "/api/v1/recruiter;x=/../admin",
                "//api/v1/recruiter/me", "/api/v1/recruiter%2f..%2fadmin", "/api/v1/recruiterx/me", "/api/v1/auth/sessions/1/extra",
                "/api/v1/auth/refreshx", "", null,
                "/api/v1/recruiter/../admin/module-access", "/api/v1/recruiter;x=/../admin", "//api/v1/recruiter/me", "/api/v1/recruiterx/me")) {
            assertFalse(RecruiterFenceFilter.isAllowedForRecruiter(path), String.valueOf(path));
        }
        assertTrue(RecruiterFenceFilter.isAllowedForRecruiter("/api/v1/recruiter/me/"));
    }
}
