package com._42students.lms.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebMvc
public class RestConfig implements WebMvcConfigurer {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        return new RestTemplate(factory);
    }

    @Bean
    public BCryptPasswordEncoder encoder(){
        return new BCryptPasswordEncoder();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(buildAllowedOriginPatterns())
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    private String[] buildAllowedOriginPatterns() {
        List<String> patterns = new ArrayList<>();
        patterns.add("http://localhost:*");
        patterns.add("https://42lms.com");
        patterns.add("https://www.42lms.com");
        patterns.add("https://*.42lms.com");

        String originsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
        if (originsEnv != null && !originsEnv.trim().isEmpty()) {
            for (String origin : originsEnv.split(",")) {
                if (origin != null && !origin.trim().isEmpty()) {
                    patterns.add(origin.trim());
                }
            }
        }
        return patterns.toArray(new String[0]);
    }

}

