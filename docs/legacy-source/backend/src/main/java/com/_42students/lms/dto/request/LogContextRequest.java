package com._42students.lms.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class LogContextRequest {
    private List<UserRef> users;
    private List<Integer> collegeIds;

    @Data
    public static class UserRef {
        private Integer id;
        private String userType;
    }
}
