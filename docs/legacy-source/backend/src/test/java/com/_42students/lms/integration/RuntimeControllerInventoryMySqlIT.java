package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Authoritative runtime controller denominator. The original closure audit scanned only one source
 * package and missed 16 routable controllers; this guard asks Spring which application controllers
 * are actually mapped and fails closed on drift.
 */
class RuntimeControllerInventoryMySqlIT extends AbstractMySqlHttpIT {

    private static final Set<String> EXPECTED = Set.of(
            "AdminAssignmentContentWriteController","AdminAssignmentController","AdminAssignmentPublishController",
            "AdminAttendanceController","AdminAttendancePolicyController","AdminClassScheduleController",
            "AdminCollegeDashboardController","AdminCollegeSummaryController","AdminCourseBulkController",
            "AdminCourseProgressController","AdminGroupController","AdminJobController",
            "AdminLearnerProgressController","AdminLessonBulkController","AdminNotificationDeliveryController",
            "AdminProjectController","AdminProjectTemplateController","AdminQuizController",
            "AdminRecycleBinController","AdminSmsLogController","AdminUserLifecycleController",
            "AnnouncementController","AnnouncementSearchController","AssignmentController",
            "AttendanceBulkController","AuthController","BatchController","BatchSearchController",
            "ChoicesController","ClassController","ClassScheduleController","ClassSearchController",
            "ClassroomController","ClientErrorReportController","ClientSettingsController",
            "CollegeController","CollegeSearchController","CompanyController","CourseController",
            "CourseSearchController","DepartmentController","DepartmentSearchController",
            "DiscussionController","ElectiveAdminController","FacultyClassScheduleController",
            "FacultyController","FacultyCourseAssociationController","FacultyLessonContentController",
            "FacultyProfileController","FacultySearchController","FacultyTeachingAssignmentController",
            "FeatureFlagController","FileUploadController","InterviewController",
            "JobApplicationSearchController","JobController","JobSearchController",
            "LearnerController","LearnerEligibilityController","LearnerGroupController",
            "LearnerOfferController","LearnerPlacementController","LearnerPlacementProfileController",
            "LearnerProfileController","LearnerRegistrationController","LearnerRequestController",
            "LearnerScheduleController","LearnerSearchController","LectureHallController",
            "LectureHallSearchController","LessonContentController","LessonController",
            "LessonSearchController","ModuleAccessController","NewProgramController",
            "NotificationController","NotificationSearchController","OrganizationController",
            "PlacementJobController","ProfileVerificationController","ProgramController",
            "ProgramSearchController","ProgramStructureController","ProjectWorkspaceController",
            "PublicBugTrackerController","PublicE2eAuthController","PublicMobileAuthController",
            "PublicRecruiterInviteController","PublicShareController","PublicTenantController",
            "PublicTrackerLogsAccessController","QuizController","RecruiterCollegeController",
            "RecruiterDriveController","RecruiterPendingInviteController","RecruiterPlanDriveController",
            "RecruiterSelfController","ResourceFileController","ResourceUploadController",
            "SemesterController","SemesterSearchController","SkillController","SkillsSearchController",
            "StudentCourseController","StudentImageController","SuperAdminAuditController",
            "SuperAdminBugTrackerController","SuperAdminE2eController","SuperAdminFeatureController",
            "SuperAdminLogsController","SuperAdminRecruiterController","SuperAdminUserAdminController",
            "TelegramWebhookController","TenantAdminController","TpoApplicantController",
            "TpoBatchesController","TpoDriveController","TpoHubController","TpoOfferController",
            "TpoRecruiterAccessController","TpoRecruiterLeadController","TpoRequestController",
            "TpoResultsController","TpoSeasonController","TpoSettingsController","TpoStudentController",
            "TpoStudentsHubController","TpoWorkspaceController","UserController"
    );

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping mappings;

    @Test
    void runtimeApplicationControllerSetMatchesReviewedDenominatorExactly() {
        Set<String> actual = mappings.getHandlerMethods().values().stream()
                .map(HandlerMethod::getBeanType)
                .filter(type -> type.getName().startsWith("com._42students.lms."))
                .map(Class::getSimpleName)
                .collect(Collectors.toCollection(TreeSet::new));

        assertEquals(new TreeSet<>(EXPECTED), actual,
                "BLOCKED: runtime controller inventory drifted. Review every new/removed controller and update evidence deliberately.");
    }

    @Test
    void everyApplicationRouteDeclaresAnExplicitHttpMethod() {
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : mappings.getHandlerMethods().entrySet()) {
            HandlerMethod handler = entry.getValue();
            if (!handler.getBeanType().getName().startsWith("com._42students.lms.")) continue;

            assertFalse(entry.getKey().getMethodsCondition().getMethods().isEmpty(),
                    () -> "BLOCKED: route accepts every HTTP method: "
                            + handler.getBeanType().getSimpleName() + "#" + handler.getMethod().getName());
        }
    }
}
