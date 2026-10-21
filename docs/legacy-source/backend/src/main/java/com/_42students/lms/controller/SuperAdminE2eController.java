package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.E2eSeedService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/superadmin/e2e")
@RequiredArgsConstructor
public class SuperAdminE2eController {

    private final E2eSeedService e2eSeedService;
    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;

    // A Spring-profile allowlist check (e.g. "only when active profile is dev/uat") was
    // considered here and deliberately NOT added: none of the four k8s manifests
    // (dev-2026/uat/prod-2026/production) set SPRING_PROFILES_ACTIVE at all, so
    // Environment.getActiveProfiles() is empty in every one of them as currently deployed --
    // a profile-based gate would fail closed everywhere, including the dev/uat environments that
    // legitimately need this endpoint, silently breaking E2E test seeding rather than protecting
    // prod specifically. The real fix is the app.e2e.seed.enabled flag checked inside
    // E2eSeedService.seed() itself (see application.properties), which now defaults to false and
    // requires an explicit APP_E2E_SEED_ENABLED=true env var per-environment to turn on -- an
    // opt-in each environment's own deployment config controls, rather than a guess this
    // controller would have to make about which environment it's running in.
    @PostMapping("/seed")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @ApiOperation(value = "Create minimal deterministic E2E seed data (UAT/dev only when enabled).")
    public ResponseEntity seed() {
        // Defense-in-depth alongside @PreAuthorize (which only started actually being enforced once
        // @EnableMethodSecurity was added — see LmsApplication) — the rest of this codebase's
        // established convention is to never rely on the annotation alone.
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        E2eSeedService.SeedResult result = e2eSeedService.seed();
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result), HttpStatus.OK);
    }
}

