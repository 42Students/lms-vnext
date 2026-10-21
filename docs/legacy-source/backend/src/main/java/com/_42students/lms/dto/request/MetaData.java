package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import java.util.List;

// This class is returned wholesale (not field-by-field whitelisted) by PublicCourseDTO, the
// curated response every course-read endpoint is meant to use. Every field here MUST stay
// public-safe, display-oriented content (URLs, dates, colours, text shown on the course card/Home
// tab) -- never an internal/access-control field. A hardcoded field-by-field whitelist here would
// just duplicate this same field list and rot the moment a new one is added without updating it
// (see CourseServiceImpl#mergeMissingMetaDataFields for exactly that failure mode, fixed
// elsewhere by merging reflectively instead of via a hand-maintained list). Keeping this
// convention as a rule enforced by review, not a second list to maintain, is the durable fix.
@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class MetaData {
        private Integer amount;
        private String imageUrl;
        private List<String> takeaways;
        private String courseCode;
        private String courseType;
        private String courseColor;
        private String imageUrlLp;
        private String courseCategory;
        private String courseEndDate;
        private String courseStartDate;
        private String introduction_content;
        private String htmlContent;
        private String updatedOn;
        private String thumbnail;
}

