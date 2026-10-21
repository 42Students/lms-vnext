package com._42students.lms.service;

import com._42students.lms.dto.request.DiscussionDTO;
import com._42students.lms.dto.response.DiscussionResponseDTO;
import com._42students.lms.model.Discussions;

import java.util.List;

public interface DiscussionService {
    void postDiscussion(DiscussionDTO discussionDTO);

    List<Discussions> fetchDiscussion(int lessonContentId);
    
    /**
     * Fetch discussions with profile picture URLs included
     * @param lessonContentId The lesson content ID
     * @return List of DiscussionResponseDTO with profile picture URLs
     */
    List<DiscussionResponseDTO> fetchDiscussionsWithProfileImages(int lessonContentId);
}

