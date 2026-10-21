package com._42students.lms.controller;

import com._42students.lms.dto.response.Response;
import com._42students.lms.service.AppSettingsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Part A, "Frontend behaviour" row: client-side tunables (chat poll interval, progress-save
 * interval) were hardcoded constants, so changing how hard the clients hammer the server needed a
 * frontend redeploy.
 *
 * <p>Every other settings read in this app goes through TenantAdminController, which is
 * superadmin-gated -- a learner's browser can't call it. Rather than piggy-back these onto some
 * unrelated learner endpoint (the one-off trick used for the attendance threshold), this is a
 * small, explicit, read-only endpoint any signed-in user may call.
 *
 * <p><b>Whitelist, deliberately.</b> It returns a fixed set of known-safe keys with their
 * defaults, never {@code getAllForScope} -- the settings store also holds cookie domains, SMS
 * sender ids and OTP lockout policy, none of which should ever reach a learner's browser. Adding
 * a key here is an explicit decision to make that value public to every signed-in user.
 */
@RestController
@RequestMapping("/api/v1/client-settings")
@Slf4j
@Api(tags = "Client-tunable settings (read-only)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class ClientSettingsController extends BaseController {

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    @GetMapping
    @ApiOperation(value = "Client-tunable settings", notes = "Fixed whitelist of non-sensitive values the web clients read at runtime.")
    public ResponseEntity<Response<Map<String, Object>>> getClientSettings() {
        Map<String, Object> out = new LinkedHashMap<>();
        // Both were hardcoded 15000ms. Floors stop a bad value turning every client into a
        // hot loop against the server -- the setting can raise the interval freely, but not
        // drop it below something sane.
        out.put("chatPollIntervalMs", Math.max(3000, readInt("ui.chatPollIntervalMs", 15000)));
        out.put("progressSaveIntervalMs", Math.max(5000, readInt("ui.progressSaveIntervalMs", 15000)));
        // Same key the backend's own isWatched() reads. The video player marks completion
        // optimistically client-side and the server recomputes it authoritatively; exposing the
        // configured value here stops the two drifting apart when an admin changes it.
        out.put("watchedThresholdPercent", readInt("course.watchedThresholdPercent", 90));
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), out), HttpStatus.OK);
    }

    private int readInt(String key, int fallback) {
        return appSettingsService != null ? appSettingsService.getInt("GLOBAL", null, key, fallback) : fallback;
    }
}
