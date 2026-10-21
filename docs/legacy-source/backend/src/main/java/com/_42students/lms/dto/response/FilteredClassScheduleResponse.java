package com._42students.lms.dto.response;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class FilteredClassScheduleResponse {
    private Map<String, List<Map<String, Object>>> classes;
    private List<Map<String, Object>> absentees;
}

