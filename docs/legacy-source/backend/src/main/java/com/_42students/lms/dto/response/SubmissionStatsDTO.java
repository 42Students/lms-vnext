package com._42students.lms.dto.response;

import lombok.Data;

import java.util.List; // Import the List class

@Data
public class SubmissionStatsDTO {
    private int totalStudents;
    private int totalSubmitted;
    private int totalGraded;
    private int notGraded;
    private int notSubmitted;
    private List<Integer> notSubmittedStudentIds; // Add this field for the list of not submitted student IDs
    private List<Integer> notGradedStudentIds; // List of not graded student IDs

}

