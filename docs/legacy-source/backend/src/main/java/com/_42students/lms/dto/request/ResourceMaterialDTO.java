package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

/**
 * A material belonging to one canonical lesson Resource. A FILE references an existing
 * tenant-scoped upload; a LINK is an external HTTPS resource. Never embed upload bytes.
 *
 * Retaining fileDTO lets existing file metadata and R2 object keys survive consolidation.
 * The service validates each material before accepting a RESOURCE write.
 */
@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class ResourceMaterialDTO {
    /** FILE or LINK (case-insensitive at the API boundary). */
    private String kind;
    /** Optional user-facing label, at most 255 characters after validation. */
    private String title;
    /** Required for FILE, absent for LINK. */
    private FileDTO fileDTO;
    /** Required for LINK, absent for FILE. */
    private String url;
}
