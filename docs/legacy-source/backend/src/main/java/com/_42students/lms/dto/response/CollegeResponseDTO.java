package com._42students.lms.dto.response;

import lombok.Data;

@Data
public class CollegeResponseDTO {
    private int id;
    private String name;
    private String logo;
    private String uniqueId;
    private int orgId;
    private String city;
    private String state;
}

