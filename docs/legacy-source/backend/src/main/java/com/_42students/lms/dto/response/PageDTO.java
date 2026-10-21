package com._42students.lms.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class PageDTO<T> {
    private int pageNumber;
    private int pageSize;
    private long totalRecords;
    private List<T> records;
}
 
