package com._42students.lms.dto.request;

import lombok.Data;

import java.util.List;

/** Bulk-set one module for many selected students at once (the Students-table bulk action). */
@Data
public class ModuleAccessBulkRequest {
    private String module;
    private Boolean enabled; // null = inherit (clear each learner's override)
    private List<Integer> learnerIds;
}
