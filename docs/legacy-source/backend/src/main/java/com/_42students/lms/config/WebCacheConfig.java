package com._42students.lms.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

/**
 * 53: course reads had no conditional-request support at all -- every tab switch on the syllabus
 * screen re-fetched and re-serialized the full course payload even when nothing had changed.
 *
 * Spring's ShallowEtagHeaderFilter computes an ETag from the actual response body (an MD5 hash)
 * and short-circuits to 304 Not Modified when the client's If-None-Match matches -- this covers
 * every course-read endpoint's varying response shape (fetchCourse, by-slug, fetchAllPaged, etc.)
 * without hand-writing per-endpoint Last-Modified logic or exposing a new timestamp field.
 * The controller method still runs (the DB round-trip isn't skipped), but the response body isn't
 * re-transferred over the wire, which is the actual cost this finding calls out.
 */
@Configuration
public class WebCacheConfig {

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> courseReadEtagFilter() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> registration =
                new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        registration.addUrlPatterns("/api/v1/courses/*");
        registration.setName("courseReadEtagFilter");
        return registration;
    }
}
