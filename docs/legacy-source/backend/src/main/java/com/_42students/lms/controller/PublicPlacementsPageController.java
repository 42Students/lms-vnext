package com._42students.lms.controller;

import com._42students.lms.model.College;
import com._42students.lms.service.TenantResolutionService;
import com._42students.lms.service.tpo.CompanyJoinService.JoinProblem;
import com._42students.lms.service.tpo.PlacementsPageService;
import com._42students.lms.util.RequestHostUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * The college's public placements page (D2 default), under /api/v1/public/**. The college is the one the address belongs to;
 * the main site and a page the college has not switched on answer a quiet 404.
 */
@RestController
@RequestMapping("/api/v1/public/placements-page")
public class PublicPlacementsPageController {

    private final PlacementsPageService pages;
    private final TenantResolutionService tenants;

    public PublicPlacementsPageController(PlacementsPageService pages, TenantResolutionService tenants) {
        this.pages = pages;
        this.tenants = tenants;
    }

    public static class RecruitBody {
        public String email;
        public String code;
        public String name;
        public String company;
        public String phone;
        public String note;
    }

    private College college(HttpServletRequest request) {
        return tenants.resolveCollegeFromHost(RequestHostUtil.getEffectiveHostHeader(request))
                .orElseThrow(() -> new JoinProblem("PAGE_NOT_FOUND", "Not found"));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> page(HttpServletRequest request) {
        College c = college(request);
        Map<String, Object> page = pages.page(c.getId(), c.getName());
        if (page == null) throw new JoinProblem("PAGE_NOT_FOUND", "Not found");
        return ResponseEntity.ok(page);
    }

    @PostMapping("/send-code")
    public ResponseEntity<Map<String, Object>> sendCode(HttpServletRequest request, @RequestBody RecruitBody b) {
        College c = college(request);
        if (pages.page(c.getId(), c.getName()) == null) throw new JoinProblem("PAGE_NOT_FOUND", "Not found");
        return ResponseEntity.ok(pages.sendCode(c.getId(), b == null ? null : b.email));
    }

    @PostMapping("/recruit")
    public ResponseEntity<Map<String, Object>> recruit(HttpServletRequest request, @RequestBody RecruitBody b) {
        College c = college(request);
        if (pages.page(c.getId(), c.getName()) == null) throw new JoinProblem("PAGE_NOT_FOUND", "Not found");
        if (b == null) throw new JoinProblem("BODY_REQUIRED", "Details are required");
        return ResponseEntity.ok(pages.recruit(c.getId(), b.email, b.code, b.name, b.company, b.phone, b.note));
    }

    @ExceptionHandler(JoinProblem.class)
    public ResponseEntity<Map<String, String>> problem(JoinProblem e) {
        if ("PAGE_NOT_FOUND".equals(e.getCode())) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PAGE_NOT_FOUND"));
        return ResponseEntity.badRequest().body(Map.of("error", e.getCode(), "message", e.getMessage()));
    }
}
