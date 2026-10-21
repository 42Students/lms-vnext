package com._42students.lms.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * True parallel HTTP races for tenant-domain invariants.
 */
class TenantDomainConcurrencyMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 109101;
    private static final int COLLEGE_B = 109102;

    @AfterEach
    void cleanup() {
        jdbc.update("delete from admin_audit_log where college_id in (?, ?)", COLLEGE_A, COLLEGE_B);
        jdbc.update("delete from tenant_domain where college_id in (?, ?)", COLLEGE_A, COLLEGE_B);
        jdbc.update("delete from college where id in (?, ?)", COLLEGE_A, COLLEGE_B);
    }

    private void seedColleges() {
        seedCollege(COLLEGE_A, "Tenant Race College A");
        seedCollege(COLLEGE_B, "Tenant Race College B");
    }

    @Test
    void concurrentCreateOfSameHostLeavesExactlyOneDurableOwner() throws Exception {
        seedColleges();
        String token = accessToken(superAdminPrincipal());
        String host = "race-host.example.test";

        List<MockHttpServletRequestBuilder> requests = List.of(
                post("/api/v1/superadmin/tenant/domains")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_A + ",\"host\":\"" + host + "\",\"isPrimary\":true}"),
                post("/api/v1/superadmin/tenant/domains")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_B + ",\"host\":\"" + host + "\",\"isPrimary\":true}")
        );

        List<Integer> statuses = runTogether(requests);
        Collections.sort(statuses);

        assertEquals(List.of(200, 409), statuses,
                "one request must win and the other must receive a conflict from app/DB uniqueness");
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from tenant_domain where host = ? and is_deleted = 0",
                Integer.class, host));
    }

    @Test
    void concurrentPrimarySwitchesNeverLeaveTwoActivePrimaryDomains() throws Exception {
        seedColleges();
        jdbc.update("insert into tenant_domain (college_id, host, is_primary, is_verified, is_deleted) "
                + "values (?, 'primary-a.example.test', 0, 0, 0)", COLLEGE_A);
        jdbc.update("insert into tenant_domain (college_id, host, is_primary, is_verified, is_deleted) "
                + "values (?, 'primary-b.example.test', 0, 0, 0)", COLLEGE_A);

        int a = jdbc.queryForObject(
                "select id from tenant_domain where host = 'primary-a.example.test'", Integer.class);
        int b = jdbc.queryForObject(
                "select id from tenant_domain where host = 'primary-b.example.test'", Integer.class);
        String token = accessToken(superAdminPrincipal());

        for (int round = 0; round < 4; round++) {
            jdbc.update("update tenant_domain set is_primary = 0 where college_id = ?", COLLEGE_A);

            List<Integer> statuses = runTogether(List.of(
                    put("/api/v1/superadmin/tenant/domains/" + a)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"isPrimary\":true}"),
                    put("/api/v1/superadmin/tenant/domains/" + b)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"isPrimary\":true}")
            ));

            // Each request either completes or is told it collided with the concurrent switch (409, retryable; MySQL
            // picked it as the deadlock victim and rolled it back). Never a 500, and at least one switch lands.
            assertTrue(statuses.stream().allMatch(s -> s == 200 || s == 409),
                    "primary-switch requests should complete or report a retryable conflict: " + statuses);
            assertTrue(statuses.contains(200), "at least one primary switch should complete: " + statuses);
            assertEquals(1, jdbc.queryForObject(
                    "select count(*) from tenant_domain where college_id = ? and is_primary = 1 and is_deleted = 0",
                    Integer.class, COLLEGE_A),
                    "clear-then-save must serialize so exactly one active primary survives");
        }
    }

    private List<Integer> runTogether(List<MockHttpServletRequestBuilder> requests) throws Exception {
        CountDownLatch ready = new CountDownLatch(requests.size());
        CountDownLatch fire = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(requests.size());
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (MockHttpServletRequestBuilder request : requests) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    if (!fire.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("race start timeout");
                    }
                    return mvc.perform(request).andReturn().getResponse().getStatus();
                }));
            }
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            fire.countDown();

            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> future : futures) {
                statuses.add(future.get(15, TimeUnit.SECONDS));
            }
            return statuses;
        } finally {
            pool.shutdownNow();
        }
    }
}
