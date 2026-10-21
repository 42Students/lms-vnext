package com._42students.lms.configuration;

import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

/**
 * Permit-all security config for controller access integration tests so the real
 * WebSecurityConfig (and its JWT/filter dependencies) is not loaded.
 */
@org.springframework.context.annotation.Configuration
@EnableWebSecurity
@Profile("controllerAccessTest")
public class TestSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeRequests().anyRequest().permitAll();
    }
}
