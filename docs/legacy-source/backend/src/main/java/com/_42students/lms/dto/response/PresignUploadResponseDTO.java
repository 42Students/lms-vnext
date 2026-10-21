package com._42students.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PresignUploadResponseDTO {

    @JsonProperty("uploadUrl")
    private String uploadUrl;

    @JsonProperty("key")
    private String key;

    @JsonProperty("publicUrl")
    private String publicUrl;

    @JsonProperty("uploadReceiptId")
    private String uploadReceiptId;

    public PresignUploadResponseDTO(String uploadUrl, String key, String publicUrl) {
        this(uploadUrl, key, publicUrl, null);
    }

    public PresignUploadResponseDTO(String uploadUrl, String key, String publicUrl, String uploadReceiptId) {
        this.uploadUrl = uploadUrl;
        this.key = key;
        this.publicUrl = publicUrl;
        this.uploadReceiptId = uploadReceiptId;
    }
}

