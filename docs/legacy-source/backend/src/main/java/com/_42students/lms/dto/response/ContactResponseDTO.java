package com._42students.lms.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ContactResponseDTO {
    int size;
    List<ContactDTO> contactDTOList;
}

