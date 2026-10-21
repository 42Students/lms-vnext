package com._42students.lms.model;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "college_branding")
@Data
public class CollegeBranding extends BaseModel {

    @Column(name = "college_id", nullable = false, unique = true)
    private Integer collegeId;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "login_background_url")
    private String loginBackgroundUrl;

    @Column(name = "login_background_url_mobile")
    private String loginBackgroundUrlMobile;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    // college_branding.login_theme (V198) held a per-college login gradient; removed the same day (every college now
    // gets the same 42LMS look), so the column is left unused and unmapped.

    /** Sign-in methods on this college's address: EMAIL_PHONE, PHONE_EMAIL, EMAIL_ONLY, PHONE_ONLY; null = EMAIL_PHONE. */
    @Column(name = "login_methods")
    private String loginMethods;

    public static final String LOGIN_METHODS_DEFAULT = "EMAIL_PHONE";
    public static final java.util.Set<String> LOGIN_METHODS =
            java.util.Set.of("EMAIL_PHONE", "PHONE_EMAIL", "EMAIL_ONLY", "PHONE_ONLY");

    /** The effective setting: a known value, or the default. */
    public static String effectiveLoginMethods(CollegeBranding b) {
        String v = b != null && b.getLoginMethods() != null ? b.getLoginMethods().trim().toUpperCase() : null;
        return v != null && LOGIN_METHODS.contains(v) ? v : LOGIN_METHODS_DEFAULT;
    }

    @Column(name = "support_email")
    private String supportEmail;

    @Column(name = "support_phone")
    private String supportPhone;

    @Column(name = "terms_url")
    private String termsUrl;

    @Column(name = "privacy_url")
    private String privacyUrl;
}

