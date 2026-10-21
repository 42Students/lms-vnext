package com._42students.lms.dto.response;

import lombok.Data;

import java.util.Map;

@Data
public class MetricsResponseDTO {
    Map<String, Integer> metricsResponse;
}

