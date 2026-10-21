package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoEmailCampaignService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/** Email campaigns from Engage (phase 3). Under /api/v1/tpo. */
@RestController
@RequestMapping("/api/v1/tpo/campaigns")
@RequiredArgsConstructor
public class TpoEmailCampaignController {

    private final TpoEmailCampaignService campaigns;
    private final SecurityContextUtil securityContextUtil;

    public static class SendBody {
        public String subject;
        public String body;
        public List<Long> recruiterLeadIds;
    }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("campaigns", campaigns.list(securityContextUtil.getAuthenticatedUserPrincipal().getCollegeId()), "emailAvailable", campaigns.emailAvailable());
    }

    @PostMapping
    public Map<String, Object> send(@RequestBody SendBody b, HttpServletRequest http) {
        UserPrincipal me = securityContextUtil.getAuthenticatedUserPrincipal();
        // The unsubscribe link points at the site the TPO is on; CORS already limits Origin to our own sites.
        return campaigns.send(me.getCollegeId(), me.getId(), b == null ? null : b.subject, b == null ? null : b.body,
                b == null ? null : b.recruiterLeadIds, http.getHeader("Origin"));
    }
}
