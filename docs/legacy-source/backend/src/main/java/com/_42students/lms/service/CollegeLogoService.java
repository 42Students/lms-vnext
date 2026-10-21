package com._42students.lms.service;

import com._42students.lms.model.College;
import com._42students.lms.model.CollegeBranding;
import com._42students.lms.repository.CollegeBrandingRepository;
import com._42students.lms.repository.CollegeRepository;
import org.springframework.stereotype.Service;

/**
 * The one college logo used everywhere: the login card, the in-app top bar (memberships), the recruiter's college
 * list, TPO settings. A super admin sets it in Manage College > Branding (college_branding.logo_url); older colleges
 * without one fall back to the logo on the college record. TPO's own logo field (tpo_college_settings.logo_url) is
 * no longer read.
 */
@Service
public class CollegeLogoService {

    private final CollegeBrandingRepository collegeBrandingRepository;
    private final CollegeRepository collegeRepository;

    public CollegeLogoService(CollegeBrandingRepository collegeBrandingRepository, CollegeRepository collegeRepository) {
        this.collegeBrandingRepository = collegeBrandingRepository;
        this.collegeRepository = collegeRepository;
    }

    public String logoOf(College college) {
        if (college == null) return null;
        try {
            CollegeBranding b = collegeBrandingRepository.findActiveByCollegeId(college.getId()).orElse(null);
            String branded = b != null ? blankToNull(b.getLogoUrl()) : null;
            if (branded != null) return branded;
        } catch (RuntimeException ignored) {
            // A branding lookup failure must not break the page that only wanted a logo.
        }
        return blankToNull(college.getLogo());
    }

    public String logoOf(Integer collegeId) {
        if (collegeId == null) return null;
        return logoOf(collegeRepository.findById(collegeId).orElse(null));
    }

    /** For callers that may run without this bean (unit tests build some services by hand). */
    public static String logoOf(CollegeLogoService service, College college) {
        if (service != null) return service.logoOf(college);
        return college != null ? blankToNull(college.getLogo()) : null;
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
