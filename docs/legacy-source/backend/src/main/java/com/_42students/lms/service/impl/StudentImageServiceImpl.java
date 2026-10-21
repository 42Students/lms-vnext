package com._42students.lms.service.impl;
import com._42students.lms.model.StudentImage;
import com._42students.lms.repository.StudentImageRepository;
import com._42students.lms.service.StudentImageService;
import com._42students.lms.utils.ContentUrlValidator;
import com.google.gson.Gson;
import com._42students.lms.dto.request.StudentImageRequestDTO;
import com._42students.lms.dto.response.StudentImageResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.google.gson.reflect.TypeToken;
import com._42students.lms.model.ImageEntry;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
 
@Service
public class StudentImageServiceImpl implements StudentImageService {

    private final StudentImageRepository studentImageRepository;

    @Autowired(required = false)
    private ContentUrlValidator contentUrlValidator;

    @Autowired
    public StudentImageServiceImpl(StudentImageRepository studentImageRepository) {
        this.studentImageRepository = studentImageRepository;
    }

    @Override
    public StudentImageResponseDTO createStudentImages(StudentImageRequestDTO requestDTO) {
        StudentImage studentImage = new StudentImage();
        studentImage.setLearnerId(requestDTO.getLearnerId());
        studentImage.setImageData(generateImageData(requestDTO.getImageUrls()));
        
        StudentImage savedImage = studentImageRepository.save(studentImage);
        return convertToResponseDTO(Collections.singletonList(savedImage));
    }

    @Override
    public StudentImageResponseDTO fetchStudentImagesByLearnerId(String learnerId) {
        StudentImage studentImage = studentImageRepository.findByLearnerId(learnerId);
        if (studentImage == null) {
            return null; // Image not found
        }
        return convertToResponseDTO(Collections.singletonList(studentImage));
    }

    @Override
    public boolean deactivateImage(String learnerId, String imageId) {
        StudentImage studentImage = studentImageRepository.findByLearnerId(learnerId);
        if (studentImage == null) {
            return false; // Learner not found
        }
    
        String updatedImageData = updateActiveStatus(studentImage.getImageData(), imageId, 0);
        studentImage.setImageData(updatedImageData);
        studentImageRepository.save(studentImage);
        return true;
    }
    

    private String generateImageData(List<String> imageUrls) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.node.ArrayNode array = mapper.createArrayNode();
        for (String imageUrl : imageUrls) {
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                throw new RuntimeException("Image URL cannot be empty");
            }
            String u = imageUrl.trim();
            if (!u.startsWith("https://")) {
                throw new RuntimeException("Image URL must be a valid https URL");
            }
            if (contentUrlValidator != null
                    && !contentUrlValidator.isAllowedContentUrl(u)
                    && !contentUrlValidator.isAllowedStorageKey(u)) {
                throw new RuntimeException("Image URL or storage key is not allowed.");
            }
            String imageId = generateImageId();
            com.fasterxml.jackson.databind.node.ObjectNode entry = mapper.createObjectNode();
            entry.put("imageId", imageId);
            entry.put("imageUrl", u);
            entry.put("active", 1);
            array.add(entry);
        }
        try {
            return mapper.writeValueAsString(array);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize image data", e);
        }
    }
    

    private String generateImageId() {
        return UUID.randomUUID().toString().replaceAll("-", "").substring(0, 12);
    }


    private StudentImageResponseDTO convertToResponseDTO(List<StudentImage> studentImages) {
        StudentImageResponseDTO responseDTO = new StudentImageResponseDTO();
        List<ImageEntry> imageEntries = new ArrayList<>();
        
        for (StudentImage studentImage : studentImages) {
            List<ImageEntry> imageEntriesJson = parseImageEntries(studentImage.getImageData());
            imageEntries.addAll(imageEntriesJson);
        }
        
        responseDTO.setLearnerId(studentImages.get(0).getLearnerId());
        responseDTO.setImages(imageEntries);
        
        return responseDTO;
    }
    
    
    
    
    
    

    private List<ImageEntry> parseImageEntries(String jsonData) {
        Gson gson = new Gson();
        Type listType = new TypeToken<List<ImageEntry>>() {}.getType();
        return gson.fromJson(jsonData, listType);
    }
    

    private String updateActiveStatus(String imageData, String imageIdToUpdate, int newActiveStatus) {
        Gson gson = new Gson();
        Type listType = new TypeToken<List<ImageEntry>>() {}.getType();
        List<ImageEntry> imageEntries = gson.fromJson(imageData, listType);
    
        for (ImageEntry entry : imageEntries) {
            if (entry.getImageId().equals(imageIdToUpdate)) {
                entry.setActive(newActiveStatus);
                break;
            }
        }
    
        return gson.toJson(imageEntries);
    }


    
}

