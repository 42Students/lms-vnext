package com._42students.lms.service;

import com._42students.lms.dto.request.QuizSubmitRequestDTO;
import com._42students.lms.dto.request.QuizUpsertRequestDTO;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.dto.response.QuizAttemptResponseDTO;
import com._42students.lms.dto.response.QuizResponseDTO;
import com._42students.lms.security.UserPrincipal;

import java.util.List;

public interface QuizService {
    QuizResponseDTO createQuiz(QuizUpsertRequestDTO request, UserPrincipal principal);
    QuizResponseDTO updateQuiz(int quizId, QuizUpsertRequestDTO request, UserPrincipal principal);
    QuizResponseDTO publishQuiz(int quizId, UserPrincipal principal);

    /**
     * Section 4 #3: reverses a mistaken publish back to DRAFT. Unpublishing itself doesn't touch
     * questions/attempts -- it only stops NEW submissions (submitQuiz requires status ==
     * PUBLISHED); any attempts already submitted, and their scores, are untouched.
     */
    QuizResponseDTO unpublishQuiz(int quizId, UserPrincipal principal);

    void deleteQuiz(int quizId, UserPrincipal principal);

    /**
     * Publishes or withholds a quiz's scores/correct-answers from learners. Faculty/admin always
     * see scores regardless of this flag, so they can review before publishing.
     */
    QuizResponseDTO setGradePublished(int quizId, boolean published, UserPrincipal principal);
    QuizResponseDTO getQuiz(int quizId, UserPrincipal principal, boolean includeCorrectAnswers);
    QuizResponseDTO getQuizForAttempt(int quizId, UserPrincipal principal);
    List<QuizResponseDTO> listQuizzes(Integer courseId, Integer lessonId, Integer classId, UserPrincipal principal);
    PageResponseDTO<QuizResponseDTO> listQuizzesPaged(Integer courseId, Integer classId, int page, int size, UserPrincipal principal);

    // Admin oversight — every quiz across a college regardless of authoring faculty. See
    // QuizRepository.findByCollegeIdPaged.
    PageResponseDTO<QuizResponseDTO> listQuizzesForAdmin(Integer collegeId, Integer courseId, int page, int size, UserPrincipal principal);
    QuizAttemptResponseDTO submitQuiz(int quizId, QuizSubmitRequestDTO request, UserPrincipal principal);
    List<QuizAttemptResponseDTO> getSubmissions(int quizId, UserPrincipal principal);
    List<QuizAttemptResponseDTO> getMySubmissions(Integer quizId, UserPrincipal principal);
}
