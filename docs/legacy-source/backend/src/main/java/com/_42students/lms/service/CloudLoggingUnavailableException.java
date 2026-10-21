package com._42students.lms.service;

public class CloudLoggingUnavailableException extends RuntimeException {
    public CloudLoggingUnavailableException(String message) {
        super(message);
    }

    public CloudLoggingUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
