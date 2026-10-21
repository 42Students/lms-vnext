package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.DiscussionDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.Lesson;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.DiscussionService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/v1/discussion")
@Slf4j
@Validated
public class DiscussionController  extends BaseController{

    @Autowired
    DiscussionService discussionService;

    @Autowired(required = false)
    LessonContentsService lessonContentsService;

    @Autowired(required = false)
    LessonService lessonService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired
    AccessControlService accessControlService;

    private void requireAccessToLessonContent(int lessonContentId) {
        if (lessonContentsService == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Service unavailable");
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        LessonContents content = lessonContentsService.getLessonContents(lessonContentId);
        if (content == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        // Browse checks decide tenant scope; teaching scope (F-032) keeps a faculty member to discussions they teach.
        if (content.getClassId() != null && content.getClassId() > 0) {
            accessControlService.requireAccessClass(principal, content.getClassId());
            accessControlService.requireTeachingScope(principal, content.getCourseId(), content.getClassId());
            return;
        }
        if (content.getCourseId() != null && content.getCourseId() > 0) {
            accessControlService.requireAccessCourse(principal, content.getCourseId());
            accessControlService.requireTeachingScope(principal, content.getCourseId(), null);
            return;
        }
        if (lessonService != null) {
            Lesson lesson = lessonService.fetchCourseId(content.getLessonId());
            if (lesson != null && lesson.getCourseId() > 0) {
                accessControlService.requireAccessCourse(principal, lesson.getCourseId());
                accessControlService.requireTeachingScope(principal, lesson.getCourseId(), null);
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: lesson content has no course or class scope");
    }

    @RequestMapping(value = "/post", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Post a discussion for a lesson content id", notes = "Requires access to the lesson content.")
    public ResponseEntity postDiscussion(@Valid @RequestBody DiscussionDTO discussionDTO)
            throws Exception {
        requireAccessToLessonContent(discussionDTO.getLessonContentId());
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        discussionDTO.setUserId(principal.getId());
        discussionService.postDiscussion(discussionDTO);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),"success"), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchDiscussion", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch discussions for a lesson content id with profile images", notes = "Requires access to the lesson content.")
    public ResponseEntity fetchDiscussion(int lessonContentId)
            throws Exception {
        requireAccessToLessonContent(lessonContentId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                discussionService.fetchDiscussionsWithProfileImages(lessonContentId)), HttpStatus.OK);
    }

}

