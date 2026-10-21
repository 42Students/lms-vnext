package com._42students.lms.dto.response;

import lombok.Data;

@Data
public class ContactDTO {
    private String firstName;
    private String lastName;
    private String userType;
    private String email;
    private String contactMobile;
    private String contactPhone;
    private String profileImageUrl;

}

