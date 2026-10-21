package com._42students.lms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.net.URI;
import java.util.regex.Pattern;

/**
 * Prevent the generic file endpoints from bypassing exact Resource/material authorization.
 * Generic lesson-content DELETE is disabled while storage references are not ref-counted:
 * deleting one legacy file can irreversibly break several lessons.
 */
@Configuration
public class CanonicalResourceFileRouteGuard implements WebMvcConfigurer {
    private static final Pattern NEW_RESOURCE_KEY = Pattern.compile(
            "^org-[0-9]+/college-[0-9]+/lesson-content/(?:course-[0-9]+(?:/class-[0-9]+)?|class-[0-9]+)/user-[0-9]+/[^/]+$");

    static String normalizeFileKey(String value) {
        if (value == null) return "";
        String key = value.trim();
        if (key.contains("://")) {
            try {
                URI uri = URI.create(key);
                key = uri.getPath() == null ? "" : uri.getPath();
            } catch (IllegalArgumentException invalidUrl) {
                return "";
            }
        }
        while (key.startsWith("/")) key = key.substring(1);
        if (key.startsWith("storagelms/")) key = key.substring("storagelms/".length());
        int query = key.indexOf('?');
        if (query >= 0) key = key.substring(0, query);
        return key;
    }

    static boolean forbidGenericFileRoute(String method, String fileName) {
        String key = normalizeFileKey(fileName);
        if (NEW_RESOURCE_KEY.matcher(key).matches()) return true;
        // Preserve the R2 objects for both legacy and new lesson content until an
        // inventory and reference-aware cleanup are verified. No user-supplied course
        // hint is adequate authorization to destroy another lesson's shared object.
        return "DELETE".equalsIgnoreCase(method)
                && (key.startsWith("lesson-content/")
                    || key.matches("^org-[0-9]+/college-[0-9]+/lesson-content/.*"));
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
                    throws java.io.IOException {
                if (!forbidGenericFileRoute(request.getMethod(), request.getParameter("fileName"))) return true;
                response.sendError(HttpServletResponse.SC_FORBIDDEN,
                        "Use the authorized Resource material endpoint; lesson files cannot be deleted directly");
                return false;
            }
        }).addPathPatterns("/api/v1/upload/file/get", "/api/v1/upload/file/download",
                "/api/v1/upload/file/stream", "/api/v1/upload/file/delete");
    }
}
