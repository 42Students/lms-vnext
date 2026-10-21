package com._42students.lms.exceptions;

import org.springframework.http.HttpStatus;

public class ValidationException extends CustomException{
    
    public ValidationException(String message) {
        super("Validation Failed: "+message, HttpStatus.BAD_REQUEST);
    }
}

