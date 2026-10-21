package com._42students.lms.dto.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoundForm {
    private Long id;
    private Integer seq;
    /** TALK|TEST|VENDOR_TEST|GD|INTERVIEW */
    private String kind;
    private String name;
    /** ON_CAMPUS|VIRTUAL */
    private String mode;
    private LocalDateTime scheduledDate;
    private String venue;
    private String meetingUrl;
    private String whatToBring;
    private String platform;
    private String testLink;
    private Integer durationMinutes;
    private LocalDateTime resultsDue;
}
