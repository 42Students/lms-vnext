package com._42students.lms.exceptions;

import org.springframework.http.HttpStatus;

public class CustomException extends RuntimeException{
    private final HttpStatus returnStatus;

    public CustomException(String customMessage) {
        super(customMessage);
        returnStatus = HttpStatus.BAD_REQUEST;
    }
    
    public CustomException(String customMessage, HttpStatus returnStatus) {
        super(customMessage);
        this.returnStatus = returnStatus;
    }

    public HttpStatus getReturnStatus() {
        return returnStatus;
    }
}

