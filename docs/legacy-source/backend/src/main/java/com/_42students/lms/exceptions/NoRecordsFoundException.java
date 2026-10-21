package com._42students.lms.exceptions;

import org.springframework.http.HttpStatus;

public class NoRecordsFoundException extends CustomException{
    
    public NoRecordsFoundException() {
        super("No Records Found", HttpStatus.NOT_FOUND);
    }
}

