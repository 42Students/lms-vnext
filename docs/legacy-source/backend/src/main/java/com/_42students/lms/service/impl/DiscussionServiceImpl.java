package com._42students.lms.service.impl;

import com._42students.lms.dto.request.DiscussionDTO;
import com._42students.lms.dto.response.DiscussionResponseDTO;
import com._42students.lms.model.Discussions;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model._Class;
import com._42students.lms.repository.DiscussionRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.DiscussionService;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DiscussionServiceImpl implements DiscussionService {

    @Autowired
    DiscussionRepository discussionRepository;
    
    @Autowired
    LearnerRepository learnerRepository;
    
    @Autowired
    FacultyRepository facultyRepository;
    
    @Autowired(required = false)
    _ClassRepository classRepository;

    @Autowired(required = false)
    SecurityContextUtil securityContextUtil;

    @Override
    public void postDiscussion(DiscussionDTO discussionDTO) {
        Discussions discussions = new Discussions();
        if (discussionDTO.getContentText() != null) {
            discussions.setContentText(InputSanitizer.sanitizePreserveNewlines(discussionDTO.getContentText().trim()));
        }
        discussions.setSequence(discussionDTO.getSequence());
        discussions.setUserId(discussionDTO.getUserId());
        discussions.setLessonContentId(discussionDTO.getLessonContentId());

        // Do not trust client-supplied userName/profileName (identity-spoofing risk).
        // Resolve the sender's display name from the authenticated principal instead.
        String[] resolvedNames = resolveAuthenticatedDisplayNames();
        discussions.setUserName(resolvedNames[0]);
        discussions.setProfileName(resolvedNames[1]);

        discussionRepository.save(discussions);
    }

    /**
     * Resolves {userName, profileName} from the authenticated principal, ignoring any
     * client-supplied values on the DTO. Falls back to nulls if the principal or the
     * corresponding Learner/Faculty record cannot be resolved.
     */
    private String[] resolveAuthenticatedDisplayNames() {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null || principal.getId() == null) {
            return new String[]{null, null};
        }
        if (principal.isLearner()) {
            Optional<Learner> learner = learnerRepository.findById(principal.getId());
            if (learner.isPresent()) {
                Learner l = learner.get();
                String fullName = joinName(l.getFirstName(), l.getLastName());
                return new String[]{l.getUniqueId(), fullName};
            }
        } else if (principal.isFaculty()) {
            Optional<Faculty> faculty = facultyRepository.findById(principal.getId());
            if (faculty.isPresent()) {
                Faculty f = faculty.get();
                String fullName = joinName(f.getFirstName(), f.getLastName());
                return new String[]{f.getUniqueId(), fullName};
            }
        }
        return new String[]{null, null};
    }

    private static String joinName(String firstName, String lastName) {
        String first = firstName != null ? firstName.trim() : "";
        String last = lastName != null ? lastName.trim() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? null : full;
    }

    @Override
    public List<Discussions> fetchDiscussion(int lessonContentId) {
        return discussionRepository.fetchDiscussion(lessonContentId);
    }

    @Override
    public List<DiscussionResponseDTO> fetchDiscussionsWithProfileImages(int lessonContentId) {
        List<Discussions> discussions = discussionRepository.fetchDiscussion(lessonContentId);
        List<DiscussionResponseDTO> responseDTOs = new ArrayList<>();
        
        for (Discussions discussion : discussions) {
            DiscussionResponseDTO dto = new DiscussionResponseDTO();
            dto.setId(discussion.getId());
            dto.setLessonContentId(discussion.getLessonContentId());
            dto.setContentText(discussion.getContentText());
            dto.setSequence(discussion.getSequence());
            dto.setUserId(discussion.getUserId());
            dto.setUserName(discussion.getUserName());
            dto.setProfileName(discussion.getProfileName());
            if (discussion.getCreatedAt() != null) {
                dto.setCreatedAt(discussion.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }

            // Fetch profile picture URL and learner details (class, roll number) from Learner or Faculty
            String profileImageUrl = getProfileImageUrl(discussion.getUserId());
            dto.setProfileImageUrl(profileImageUrl);
            enrichLearnerDisplayInfo(discussion.getUserId(), dto);
            
            responseDTOs.add(dto);
        }
        
        return responseDTOs;
    }
    
    /**
     * For learners, set className and rollNumber on the DTO for display. userName is already set from discussion.
     */
    private void enrichLearnerDisplayInfo(Integer userId, DiscussionResponseDTO dto) {
        if (userId == null || classRepository == null) return;
        Optional<Learner> learnerOpt = learnerRepository.findById(userId);
        if (learnerOpt.isEmpty()) return;
        Learner learner = learnerOpt.get();
        dto.setRollNumber(learner.getRollNumber());
        if (learner.getClassId() != null && classRepository != null) {
            classRepository.findByIdAndNotDeleted(learner.getClassId())
                .map(_Class::getName)
                .ifPresent(dto::setClassName);
        }
    }
    
    /**
     * Get profile picture URL from Learner or Faculty table based on userId
     * @param userId The user ID
     * @return Profile picture URL (website field) or null if not found
     */
    private String getProfileImageUrl(Integer userId) {
        if (userId == null) {
            return null;
        }
        
        // Try Learner first
        Optional<Learner> learnerOpt = learnerRepository.findById(userId);
        if (learnerOpt.isPresent()) {
            Learner learner = learnerOpt.get();
            String website = learner.getWebsite();
            // Return null if website is "string" or empty/whitespace (invalid values)
            if (website != null && !website.equals("string") && !website.trim().isEmpty()) {
                return website;
            }
            return null;
        }
        
        // Try Faculty
        Optional<Faculty> facultyOpt = facultyRepository.findById(userId);
        if (facultyOpt.isPresent()) {
            Faculty faculty = facultyOpt.get();
            String website = faculty.getWebsite();
            // Return null if website is "string" or empty/whitespace (invalid values)
            if (website != null && !website.equals("string") && !website.trim().isEmpty()) {
                return website;
            }
            return null;
        }
        
        return null;
    }

}

