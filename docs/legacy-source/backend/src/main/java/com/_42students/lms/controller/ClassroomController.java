package com._42students.lms.controller;

import com._42students.lms.dto.request.ClassroomMessageCreateDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.ClassroomMessage;
import com._42students.lms.service.ClassroomService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/classroom")
public class ClassroomController extends BaseController {

    private final ClassroomService classroomService;
    private final SecurityContextUtil securityContextUtil;

    public ClassroomController(ClassroomService classroomService, SecurityContextUtil securityContextUtil) {
        this.classroomService = classroomService;
        this.securityContextUtil = securityContextUtil;
    }

    @GetMapping("/messages")
    @ApiOperation(value = "Fetch classroom messages for a course/class")
    public ResponseEntity<Response<List<ClassroomMessage>>> fetchMessages(@RequestParam Integer courseId,
                                                                          @RequestParam Integer classId,
                                                                          @RequestParam(required = false) String since) {
        // Without "since": the full active history (first load). With it (an updatedAt the client got
        // from this API): only what changed since, deleted rows included, so polling no longer
        // re-downloads the whole semester's discussion every few seconds.
        if (since != null && !since.isBlank()) {
            java.time.LocalDateTime cursor;
            try {
                cursor = java.time.OffsetDateTime.parse(since).withOffsetSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
            } catch (java.time.format.DateTimeParseException e) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "since must be an ISO-8601 timestamp");
            }
            return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                    classroomService.fetchMessagesChangedSince(courseId, classId, cursor)));
        }
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                classroomService.fetchMessages(courseId, classId)));
    }

    @PostMapping("/messages")
    @ApiOperation(value = "Create classroom message")
    public ResponseEntity<Response<ClassroomMessage>> postMessage(@Valid @RequestBody ClassroomMessageCreateDTO message) {
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                classroomService.createMessage(message)));
    }

    @PatchMapping("/messages/{messageId}/pin")
    @ApiOperation(value = "Toggle classroom pin")
    public ResponseEntity<Response<ClassroomMessage>> togglePin(@PathVariable Integer messageId) {
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                classroomService.togglePin(messageId)));
    }

    @DeleteMapping("/messages/{messageId}")
    @ApiOperation(value = "Delete a classroom message (own message, or any as faculty/admin)")
    public ResponseEntity<Response<Void>> deleteMessage(@PathVariable Integer messageId) {
        classroomService.deleteMessage(messageId);
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), null));
    }
}
