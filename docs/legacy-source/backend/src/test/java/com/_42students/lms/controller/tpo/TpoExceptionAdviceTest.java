package com._42students.lms.controller.tpo;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A stale or foreign id must be a quiet 404, not an "Unhandled exception" ERROR that pages the team
 * (production alert seen 2026-09-28 for /tpo/students/1/debar and /tpo/recruiter leads/1/invite).
 * Uses the real advice on a throwaway controller in the same package, so it also proves the
 * advice applies to controllers that declare no handler of their own.
 */
class TpoExceptionAdviceTest {

    @RestController
    static class ThrowingController {
        @GetMapping("/t/not-found") String notFound() { throw new IllegalArgumentException("Not found"); }
        @GetMapping("/t/drive-not-found") String driveNotFound() { throw new IllegalArgumentException("Drive not found"); }
        @GetMapping("/t/bad-move") String badMove() { throw new IllegalArgumentException("Cannot move from APPLIED to HIRED"); }
        @GetMapping("/t/conflict") String conflict() { throw new IllegalStateException("The 48-hour reversal window has passed"); }
    }

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
            .setControllerAdvice(new TpoExceptionAdvice()).build();

    @Test void notFoundIsA404WithTheSameBodyWhetherMissingOrForeign() throws Exception {
        mvc.perform(get("/t/not-found")).andExpect(status().isNotFound()).andExpect(jsonPath("$.error").value("Not found"));
        mvc.perform(get("/t/drive-not-found")).andExpect(status().isNotFound());
    }

    @Test void rejectedInputIsA400NotA404() throws Exception {
        mvc.perform(get("/t/bad-move")).andExpect(status().is(HttpStatus.BAD_REQUEST.value()))
                .andExpect(jsonPath("$.error").value("Cannot move from APPLIED to HIRED"));
    }

    @Test void aStateConflictIsA409() throws Exception {
        mvc.perform(get("/t/conflict")).andExpect(status().isConflict());
    }
}
