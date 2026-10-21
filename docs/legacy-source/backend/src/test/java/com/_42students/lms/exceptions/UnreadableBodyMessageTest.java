package com._42students.lms.exceptions;

import com._42students.lms.dto.projects.ProjectTaskUpsertDTO;
import com._42students.lms.dto.response.Response;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;

import static org.junit.jupiter.api.Assertions.*;

/** A malformed field used to come back as an empty 400 with nothing logged. */
class UnreadableBodyMessageTest {

    @Test
    void namesTheFieldThatCouldNotBeRead() {
        Exception jackson = assertThrows(Exception.class, () -> new ObjectMapper().registerModule(new JavaTimeModule())
                .readValue("{\"dueDate\":\"TBD\"}", ProjectTaskUpsertDTO.class));
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("JSON parse error", jackson,
                new MockHttpInputMessage(new byte[0]));
        ResponseEntity<Object> res = new GlobalExceptionHandler().handleHttpMessageNotReadable(ex, new HttpHeaders(), HttpStatus.BAD_REQUEST, null);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertEquals("The value sent for 'dueDate' is not in the right format.", ((Response<?>) res.getBody()).getMessage());
    }
}
