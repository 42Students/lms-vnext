package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.SmsDeliveryLog;
import com._42students.lms.repository.SmsDeliveryLogRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Audit 4.4: lets someone answer "was the absence SMS actually sent?".
 *
 * <p>The send result was always known and always discarded. This reads the record V134 introduced,
 * which is the whole point of keeping it — a log nobody can read from the product is the same as
 * no log.
 *
 * <p>Super-admin only. The rows are deliberately thin (no message body, last four digits of the
 * number only, see SmsDeliveryLog), but they still concern parents' contact details and delivery
 * behaviour across every tenant, so this is not a college-admin surface.
 */
@RestController
@RequestMapping("/api/v1/admin/sms-log")
@Slf4j
@Api(tags = "Admin SMS Delivery Log")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminSmsLogController extends BaseController {

    @Autowired
    private SmsDeliveryLogRepository repository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @GetMapping
    @ApiOperation(value = "Recent SMS delivery attempts",
            notes = "Newest first. Narrow by the last four digits of a number and/or by purpose "
                    + "(notification, otp, job.update). Never returns message bodies or full numbers.")
    public ResponseEntity<Response<Map<String, Object>>> list(
            @RequestParam(required = false) String recipientSuffix,
            @RequestParam(required = false) String purpose,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);

        String suffix = recipientSuffix != null && !recipientSuffix.isBlank()
                ? recipientSuffix.replaceAll("[^0-9]", "")
                : null;
        if (suffix != null && suffix.length() > 4) {
            // An admin will naturally paste a whole number; take the part this table stores rather
            // than returning nothing and looking broken.
            suffix = suffix.substring(suffix.length() - 4);
        }
        String purposeFilter = purpose != null && !purpose.isBlank() ? purpose.trim() : null;

        Page<SmsDeliveryLog> result = repository.search(suffix, purposeFilter,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200)));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", result.getContent());
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages", result.getTotalPages());
        body.put("number", result.getNumber());
        body.put("size", result.getSize());
        // Said explicitly because "SENT" reads like "delivered" and it is not: BulkSMSApps reports
        // that it accepted the message, not that a handset received it.
        body.put("note", "SENT means the operator accepted the message. Handset delivery is not reported by the provider.");
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), body), HttpStatus.OK);
    }
}
