package com._42students.lms.repository;

import com._42students.lms.model.StudentImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentImageRepository extends JpaRepository<StudentImage, Long> {

    StudentImage findByLearnerId(String learnerId);

    StudentImage findByLearnerIdContaining(String imageId);

    StudentImage findByImageDataContaining(String imageId);
   



}

