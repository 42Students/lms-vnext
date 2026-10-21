package com._42students.lms.service.impl;

import com._42students.lms.dto.request.BulkFacultyCourseAssociationCreateRequestDTO;
import com._42students.lms.dto.request.FacultyCourseAssociationCreateRequestDTO;
import com._42students.lms.model.Course;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.FacultyCourseAssociation;
import com._42students.lms.repository.FacultyCourseAssociationRepository;
import com._42students.lms.service.FacultyCourseAssociationService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.dto.response.ActiveCourseResponseDTO;
import com._42students.lms.dto.response.FacultyInfoDTO;
import com._42students.lms.service.CourseService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import javax.transaction.Transactional;

@Service
public class FacultyCourseAssociationServiceImpl implements FacultyCourseAssociationService {

    private final FacultyCourseAssociationRepository associationRepository;
    private final FacultyService facultyService;
    private final CourseService courseService;

    @Autowired
    public FacultyCourseAssociationServiceImpl(FacultyCourseAssociationRepository associationRepository,FacultyService facultyService , CourseService courseService) {
        this.associationRepository = associationRepository;
        this.facultyService = facultyService;
        this.courseService = courseService;
    }

    @Override
public void createAssociation(FacultyCourseAssociationCreateRequestDTO associationCreateRequestDTO) {
    int facultyId = associationCreateRequestDTO.getFacultyId();
    List<Integer> courseIds = associationCreateRequestDTO.getCourseIds();

    for (int courseId : courseIds) {
        FacultyCourseAssociation association = new FacultyCourseAssociation();
        association.setFacultyId(facultyId);
        association.setCourseId(courseId);
        association.setActive(1);  // Set the "active" value to 1
        associationRepository.save(association);
    }
}

   @Override
    public List<ActiveCourseResponseDTO> fetchCoursesByFaculty(int facultyId) {
        List<Integer> courseIds = associationRepository.findCourseIdsByFacultyId(facultyId);
        List<ActiveCourseResponseDTO> courses = new ArrayList<>();

        for (Integer courseId : courseIds) {
            Course course = courseService.fetchCourse(courseId);
            if (course != null) {
                ActiveCourseResponseDTO courseResponse = new ActiveCourseResponseDTO();
                FacultyCourseAssociation association = associationRepository.findByFacultyIdAndCourseId(facultyId, courseId);
                courseResponse.setMappingId(association.getId());
                courseResponse.setSlug(course.getSlug());
                courseResponse.setCourseName(course.getCourseName());
                courseResponse.setDeptId(course.getDeptId());
                courses.add(courseResponse);
            }
        }

        return courses;
    }
  
    


    

    @Override
public void createBulkAssociations(BulkFacultyCourseAssociationCreateRequestDTO bulkRequestDTO) {
    List<FacultyCourseAssociationCreateRequestDTO> associations = bulkRequestDTO.getFacultyCourseAssociations();

    List<FacultyCourseAssociation> associationEntities = new ArrayList<>();
    for (FacultyCourseAssociationCreateRequestDTO association : associations) {
        int facultyId = association.getFacultyId();
        List<Integer> courseIds = association.getCourseIds();

        for (Integer courseId : courseIds) {
            FacultyCourseAssociation associationEntity = new FacultyCourseAssociation();
            associationEntity.setFacultyId(facultyId);
            associationEntity.setCourseId(courseId);
            associationEntity.setActive(1);  // Set the "active" value to 1
            associationEntities.add(associationEntity);
        }
    }

    associationRepository.saveAll(associationEntities);
}

@Override
public Integer getFacultyIdForAssociation(Long mappingId) {
    FacultyCourseAssociation association = associationRepository.findById(mappingId).orElse(null);
    return association != null ? association.getFacultyId() : null;
}

@Override
@Transactional
public void deactivateAssociation(Long mappingId) {
    FacultyCourseAssociation association = associationRepository.findById(mappingId).orElse(null);
    if (association != null) {
        association.setActive(0);
    }
}



@Override
public List<Integer> fetchActiveFacultiesByCourse(int courseId) {
    return associationRepository.findActiveFacultyIdsByCourseId(courseId);
}


@Override
public List<FacultyInfoDTO> fetchActiveFacultiesInfoByCourse(int courseId) {
    List<Integer> facultyIds = associationRepository.findActiveFacultyIdsByCourseId(courseId);
    List<FacultyInfoDTO> facultiesInfo = new ArrayList<>();
    
    for (Integer facultyId : facultyIds) {
        Faculty faculty = facultyService.getFacultyDetails(facultyId.toString());
        if (faculty != null) {
            FacultyInfoDTO facultyInfoDTO = new FacultyInfoDTO();
            
            // Get the FacultyCourseAssociation entity by facultyId and courseId
            FacultyCourseAssociation association = associationRepository.findByFacultyIdAndCourseId(facultyId, courseId);
            if (association != null) {
                facultyInfoDTO.setMappingId(association.getId());  // Set the ID of the FacultyCourseAssociation table
            }
            facultyInfoDTO.setId(faculty.getId());
            facultyInfoDTO.setDeptId(faculty.getDeptId());
            facultyInfoDTO.setFirstName(faculty.getFirstName());
            facultiesInfo.add(facultyInfoDTO);
        }
    }
    
    return facultiesInfo;
}


    @Override
    public List<ActiveCourseResponseDTO> fetchActiveCoursesByFaculty(int facultyId) {
        List<Integer> activeCourseIds = associationRepository.findActiveCourseIdsByFacultyId(facultyId);
        List<ActiveCourseResponseDTO> activeCourses = new ArrayList<>();
    
        for (Integer courseId : activeCourseIds) {
            Course course = courseService.fetchCourse(courseId);
            if (course != null) {
                ActiveCourseResponseDTO courseResponse = new ActiveCourseResponseDTO();
                courseResponse.setSlug(course.getSlug());
                courseResponse.setCourseName(course.getCourseName());
                courseResponse.setDeptId(course.getDeptId());
    
                // Get the FacultyCourseAssociation entity by facultyId and courseId
                FacultyCourseAssociation association = associationRepository.findByFacultyIdAndCourseId(facultyId, courseId);
                if (association != null) {
                    courseResponse.setMappingId(association.getId());  // Set the ID of the FacultyCourseAssociation table
                }
    
                activeCourses.add(courseResponse);
            }
        }
    
        return activeCourses;
    }
    
    // Other service methods for managing associations
}

