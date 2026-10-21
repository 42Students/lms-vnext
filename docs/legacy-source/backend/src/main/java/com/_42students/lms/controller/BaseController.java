package com._42students.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
public class BaseController {

    @Autowired
    ObjectMapper objectMapper;

    public void logRequest(String message, Object object) {
        log.info(message, objectMapper.valueToTree(object));
    }
}

