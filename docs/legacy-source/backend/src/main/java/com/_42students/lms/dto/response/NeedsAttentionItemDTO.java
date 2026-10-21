package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One row in a "needs attention" queue category — kept deliberately small (just enough to
 *  render a line and a link), not a full entity, so the landing-page queue stays cheap to load. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NeedsAttentionItemDTO {
    private Integer jobId;
    private String jobTitle;
    private Integer applicationId;
    private String learnerName;
    private String detail;
}
