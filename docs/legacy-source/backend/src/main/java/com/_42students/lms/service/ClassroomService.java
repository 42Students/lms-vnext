package com._42students.lms.service;

import com._42students.lms.dto.request.ClassroomMessageCreateDTO;
import com._42students.lms.model.ClassroomMessage;

import java.util.List;

public interface ClassroomService {
    List<ClassroomMessage> fetchMessages(Integer courseId, Integer classId);

    /** Messages changed since a moment, including deleted ones (polling). */
    List<ClassroomMessage> fetchMessagesChangedSince(Integer courseId, Integer classId, java.time.LocalDateTime since);
    ClassroomMessage createMessage(ClassroomMessageCreateDTO dto);
    ClassroomMessage togglePin(Integer messageId);
    void deleteMessage(Integer messageId);
}
