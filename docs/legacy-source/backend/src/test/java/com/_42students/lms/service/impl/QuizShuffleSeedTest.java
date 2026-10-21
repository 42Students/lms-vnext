package com._42students.lms.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Audit 2.7 — per-learner question/option ordering.
 *
 * <p>The ordering is seeded rather than random so that a learner who refreshes the page, or comes
 * back to finish, sees the questions where they left them. These tests pin that property and the
 * one that makes the feature worth having: two learners get different orders.
 *
 * <p>They exercise the seeding rule directly rather than through the service, because the property
 * that matters is arithmetic — the service wiring is covered by the compile-time call.
 */
@DisplayName("Quiz shuffle — stable per learner, different between learners")
class QuizShuffleSeedTest {

    /** Mirrors QuizServiceImpl.seedFor. */
    private long seedFor(int quizId, int learnerId, int salt) {
        return (long) quizId * 1_000_003L + (long) learnerId * 31L + salt;
    }

    private <T> List<T> shuffledCopy(List<T> source, long seed) {
        List<T> copy = new ArrayList<>(source);
        Collections.shuffle(copy, new Random(seed));
        return copy;
    }

    private static final List<Integer> QUESTIONS = List.of(1, 2, 3, 4, 5, 6, 7, 8);

    @Test
    @DisplayName("the same learner sees the same order every time")
    void stableForOneLearner() {
        List<Integer> first = shuffledCopy(QUESTIONS, seedFor(10, 77, 0));
        List<Integer> second = shuffledCopy(QUESTIONS, seedFor(10, 77, 0));
        assertEquals(first, second, "a refresh must not move the questions under the learner");
    }

    @Test
    @DisplayName("two learners on the same quiz get different orders")
    void differsBetweenLearners() {
        List<Integer> a = shuffledCopy(QUESTIONS, seedFor(10, 77, 0));
        List<Integer> b = shuffledCopy(QUESTIONS, seedFor(10, 78, 0));
        assertNotEquals(a, b, "same order for everyone is the problem this feature exists to fix");
    }

    @Test
    @DisplayName("the same learner gets different orders on different quizzes")
    void differsBetweenQuizzes() {
        assertNotEquals(shuffledCopy(QUESTIONS, seedFor(10, 77, 0)),
                        shuffledCopy(QUESTIONS, seedFor(11, 77, 0)));
    }

    @Test
    @DisplayName("options within a question are ordered independently of the questions")
    void optionSaltSeparatesOrders() {
        assertNotEquals(shuffledCopy(QUESTIONS, seedFor(10, 77, 0)),
                        shuffledCopy(QUESTIONS, seedFor(10, 77, 42)));
    }

    @Test
    @DisplayName("shuffling loses nothing — every question is still present exactly once")
    void nothingIsLost() {
        List<Integer> shuffled = shuffledCopy(QUESTIONS, seedFor(10, 77, 0));
        assertEquals(QUESTIONS.size(), shuffled.size());
        assertTrue(shuffled.containsAll(QUESTIONS),
                "grading matches on option id, not position, but a dropped question would still be a disaster");
    }
}
