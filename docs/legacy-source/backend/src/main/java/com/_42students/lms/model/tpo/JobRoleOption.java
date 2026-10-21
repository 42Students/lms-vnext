package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

/**
 * One role option on a drive (e.g. "Digital" vs "Ninja"), stored as an element of
 * job.role_options_json (a "package" on screen). The pay: CTC, base/variable, joining bonus, stipend. The bond was removed
 * on 8 Oct 2026; older rows may still carry bondNone/bondMonths/bondAmount, which are ignored.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class JobRoleOption {
    private String name;
    private BigDecimal ctcLpa;
    private BigDecimal fixedLpa;
    private BigDecimal variableLpa;
    private BigDecimal joiningBonusLpa;
    /** Internships only. */
    private BigDecimal stipendPerMonth;
    private Integer stipendMonths;
}
