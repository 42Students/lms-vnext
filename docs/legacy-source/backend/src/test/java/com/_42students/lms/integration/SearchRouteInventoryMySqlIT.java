package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression guard for the controller inventory missed by the first closure matrix.
 *
 * <p>The original audit enumerated only controller/**Controller.java and therefore skipped the
 * v2 in-memory search controllers plus SkillsSearchController. This test discovers mappings from
 * Spring itself, not from a source-directory convention, so moving a controller to another
 * package cannot silently remove it from the coverage denominator again.</p>
 */
class SearchRouteInventoryMySqlIT extends AbstractMySqlHttpIT {

    private static final Set<String> EXPECTED = Set.of(
            "AnnouncementSearchController",
            "JobApplicationSearchController",
            "BatchSearchController",
            "ClassSearchController",
            "CollegeSearchController",
            "CourseSearchController",
            "DepartmentSearchController",
            "FacultySearchController",
            "JobSearchController",
            "LearnerSearchController",
            "LectureHallSearchController",
            "LessonSearchController",
            "NotificationSearchController",
            "ProgramSearchController",
            "SemesterSearchController",
            "SkillsSearchController"
    );

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping mappings;

    private record Route(
            String controller,
            String method,
            String pattern,
            HandlerMethod handler) {
    }

    private List<Route> searchRoutes() {
        List<Route> out = new ArrayList<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : mappings.getHandlerMethods().entrySet()) {
            RequestMappingInfo info = entry.getKey();
            HandlerMethod handler = entry.getValue();
            String controller = handler.getBeanType().getSimpleName();
            if (!EXPECTED.contains(controller)) {
                continue;
            }

            Set<String> registeredPatterns = new LinkedHashSet<>();
            if (info.getPatternsCondition() != null) {
                registeredPatterns.addAll(info.getPatternsCondition().getPatterns());
            }
            if (info.getPathPatternsCondition() != null) {
                registeredPatterns.addAll(info.getPathPatternsCondition().getPatternValues());
            }
            assertFalse(registeredPatterns.isEmpty(),
                    () -> "BLOCKED: no URL pattern for " + controller + "#" + handler.getMethod().getName());

            assertFalse(info.getMethodsCondition().getMethods().isEmpty(),
                    () -> "BLOCKED: route accepts every HTTP method: " + controller + "#" + handler.getMethod().getName());

            for (String pattern : registeredPatterns) {
                info.getMethodsCondition().getMethods().forEach(method ->
                        out.add(new Route(controller, method.name(), pattern, handler)));
            }
        }
        return out.stream()
                .sorted(Comparator.comparing(Route::controller)
                        .thenComparing(Route::pattern)
                        .thenComparing(Route::method))
                .collect(Collectors.toList());
    }

    @Test
    void runtimeSpringInventoryContainsEveryPreviouslyMissedController() {
        Set<String> present = searchRoutes().stream()
                .map(Route::controller)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        assertEquals(EXPECTED, present,
                "BLOCKED: search/skills controller inventory drifted; update the evidence ledger deliberately");
    }

    @Test
    void runtimeSpringInventoryContainsAllOneHundredTwentyKnownSearchRoutes() {
        List<Route> routes = searchRoutes();
        assertEquals(120, routes.size(),
                () -> "BLOCKED: expected 120 search/skills routes but Spring registered " + routes.size()
                        + ". Inventory must be reviewed before changing this denominator.");

        long duplicateKeys = routes.stream()
                .collect(Collectors.groupingBy(r -> r.method() + " " + r.pattern(), Collectors.counting()))
                .values().stream().filter(n -> n > 1).count();
        assertEquals(0, duplicateKeys,
                "BLOCKED: duplicate HTTP method + path mappings exist inside the search/skills surface");
    }

    @Test
    void anonymousCallerCannotReachAnySearchOrSkillsRoute() throws Exception {
        List<Route> routes = searchRoutes();
        assertEquals(120, routes.size());

        for (Route route : routes) {
            String concrete = concretePath(route.pattern());
            MockHttpServletRequestBuilder builder = request(HttpMethod.valueOf(route.method()), concrete)
                    .contentType("application/json");
            mvc.perform(builder)
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void learnerCannotRefreshAnySearchCache() throws Exception {
        ensureLearner(997201, 997200);
        String token = accessToken(learnerPrincipal(997201, 997200));
        List<Route> refresh = searchRoutes().stream()
                .filter(r -> "POST".equals(r.method()) && r.pattern().endsWith("/refresh"))
                .collect(Collectors.toList());

        assertEquals(15, refresh.size(),
                "BLOCKED: expected every DB-backed search cache except static skills to expose one refresh endpoint");

        for (Route route : refresh) {
            mvc.perform(request(HttpMethod.POST, route.pattern())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void globalSuperAdminCanRefreshEveryDbBackedSearchCache() throws Exception {
        String token = accessToken(superAdminPrincipal());
        List<Route> refresh = searchRoutes().stream()
                .filter(r -> "POST".equals(r.method()) && r.pattern().endsWith("/refresh"))
                .collect(Collectors.toList());

        assertEquals(15, refresh.size());
        for (Route route : refresh) {
            mvc.perform(request(HttpMethod.POST, route.pattern())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().is2xxSuccessful());
        }
    }

    @Test
    void authenticatedLearnerCanUseTenantNeutralSkillsLookupButNotAnonymousCaller() throws Exception {
        mvc.perform(request(HttpMethod.GET, "/api/v2/skills/search")
                        .queryParam("query", "java")
                        .queryParam("limit", "5"))
                .andExpect(status().isUnauthorized());

        ensureLearner(997202, 997200);
        mvc.perform(request(HttpMethod.GET, "/api/v2/skills/search")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(997202, 997200)))
                        .queryParam("query", "java")
                        .queryParam("limit", "5"))
                .andExpect(status().isOk());
    }

    /** This class is not transactional, so seed idempotently: the college and learner may exist from an earlier test. */
    private void ensureLearner(int learnerId, int collegeId) {
        if (jdbc.queryForObject("select count(*) from college where id = ?", Integer.class, collegeId) == 0) {
            seedCollege(collegeId, "Search Inventory College");
        }
        if (jdbc.queryForObject("select count(*) from learner where id = ?", Integer.class, learnerId) == 0) {
            seedLearner(learnerId, collegeId, "SearchInventory" + learnerId);
        }
    }

    private static final Pattern PATH_VARIABLE = Pattern.compile("\\{[^/}]+}");

    private String concretePath(String pattern) {
        return PATH_VARIABLE.matcher(pattern).replaceAll("1");
    }
}
