package com._42students.lms.controller;

import com._42students.lms.service.tpo.TpoEmailCampaignService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** A campaign email's unsubscribe link (phase 3), under /api/v1/public/**. Always answers the same, used or not. */
@RestController
@RequestMapping("/api/v1/public/campaign-unsubscribe")
public class PublicCampaignUnsubscribeController {

    private final TpoEmailCampaignService campaigns;

    public PublicCampaignUnsubscribeController(TpoEmailCampaignService campaigns) {
        this.campaigns = campaigns;
    }

    @PostMapping("/{token}")
    public ResponseEntity<Map<String, Object>> unsubscribe(@PathVariable String token) {
        campaigns.unsubscribe(token);
        return ResponseEntity.ok(Map.of("status", "UNSUBSCRIBED"));
    }
}
