package com._42students.lms.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.lang.reflect.Constructor;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class CloudLoggingBeanWiringTest {
    @Test
    void productionConstructorsAreExplicitlyAutowired() {
        assertProductionConstructorAutowired(GcpMetadataCredentialProvider.class, 1);
        assertProductionConstructorAutowired(GcpCloudLoggingService.class, 2);
    }

    private void assertProductionConstructorAutowired(Class<?> type, int parameterCount) {
        Constructor<?> constructor = Arrays.stream(type.getDeclaredConstructors())
                .filter(candidate -> candidate.getParameterCount() == parameterCount)
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected production constructor on " + type.getSimpleName()));

        assertTrue(
                constructor.isAnnotationPresent(Autowired.class),
                type.getSimpleName() + " production constructor must be explicit when test constructors also exist");
    }
}
