package com._42students.lms.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards against a startup crash that no other test in the suite can see.
 *
 * With the Spring Data JPA shipped by this project (2.7.8), the framework derives a "count query"
 * from every {@code @Query} while it builds the repository proxy, even for a {@code @Modifying}
 * statement where a count is meaningless. For a native statement that is not a SELECT there is
 * nothing for the derivation to latch onto, and it throws
 * {@code NullPointerException: Cannot invoke "String.contains(CharSequence)" because "variable" is null}
 * from {@code QueryUtils.createCountQueryFor}. That exception surfaces as a
 * {@code QueryCreationException} while the context is starting, so the application never comes up.
 *
 * That is exactly what took production's rollout down on 2026-09-20/21:
 * {@code MobileLoginAttemptRepository.reserveVerificationAttempt} was added as a native UPDATE with
 * no {@code countQuery}, every unit test passed (they all mock the repository, so nothing ever asks
 * Spring Data to parse it), the image built, and the new pod crash-looped on boot.
 *
 * The established workaround in this codebase is an explicit {@code countQuery} (see
 * {@code NotificationRepository.softDeleteOlderThan}). It is never executed for a modifying query;
 * it only gives the derivation something valid to use. This test fails the build if a native
 * statement that is not a SELECT is added without one.
 */
class NativeModifyingQueryCountQueryGuardTest {

    private static final String REPOSITORY_PACKAGE = "com._42students.lms.repository";

    @Test
    void everyNativeNonSelectQueryDeclaresAnExplicitCountQuery() throws Exception {
        // The default scanner skips interfaces; repositories are interfaces.
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false) {
            @Override
            protected boolean isCandidateComponent(AnnotatedBeanDefinition beanDefinition) {
                return beanDefinition.getMetadata().isInterface() && beanDefinition.getMetadata().isIndependent();
            }
        };
        scanner.addIncludeFilter(new AssignableTypeFilter(Repository.class));

        List<String> violations = new ArrayList<>();
        int nativeQueries = 0;
        int repositories = 0;

        for (BeanDefinition definition : scanner.findCandidateComponents(REPOSITORY_PACKAGE)) {
            Class<?> repository = Class.forName(definition.getBeanClassName());
            repositories++;
            for (Method method : repository.getDeclaredMethods()) {
                Query query = method.getAnnotation(Query.class);
                if (query == null || !query.nativeQuery()) {
                    continue;
                }
                nativeQueries++;
                String sql = query.value().trim().toLowerCase(Locale.ROOT);
                boolean isSelect = sql.startsWith("select") || sql.startsWith("with");
                if (!isSelect && query.countQuery().trim().isEmpty()) {
                    violations.add(repository.getSimpleName() + "." + method.getName());
                }
            }
        }

        // A scanner that quietly finds nothing would make this guard pass vacuously.
        assertTrue(repositories > 10, "expected to discover the repository interfaces, found " + repositories);
        assertTrue(nativeQueries > 0, "expected to discover native @Query methods, found none");
        assertTrue(violations.isEmpty(),
                "Native non-SELECT @Query without a countQuery crashes Spring Data 2.7.8 at startup "
                        + "(NPE in QueryUtils.createCountQueryFor). Add a countQuery, as "
                        + "NotificationRepository.softDeleteOlderThan does. Offenders: " + violations);
    }
}
