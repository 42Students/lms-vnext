package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.JobRoleOption;

import java.math.BigDecimal;
import java.util.List;

/** Test access to the drive's pay line for a stipend-only internship. */
public final class TpoDriveServiceCtcAccess {
    private TpoDriveServiceCtcAccess() {}

    public static String stipendLine(int perMonth) {
        JobRoleOption o = new JobRoleOption();
        o.setName("Intern");
        o.setStipendPerMonth(BigDecimal.valueOf(perMonth));
        return TpoDriveService.ctcRangeOf(List.of(o));
    }
}
