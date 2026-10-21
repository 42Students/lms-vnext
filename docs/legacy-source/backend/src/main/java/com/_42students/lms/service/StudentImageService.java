package com._42students.lms.service;

import com._42students.lms.dto.request.StudentImageRequestDTO;
import com._42students.lms.dto.response.StudentImageResponseDTO;

public interface StudentImageService {
    StudentImageResponseDTO createStudentImages(StudentImageRequestDTO requestDTO);

    StudentImageResponseDTO fetchStudentImagesByLearnerId(String learnerId);

    boolean deactivateImage(String learnerId, String imageId); // Updated method signature

   
}
 
