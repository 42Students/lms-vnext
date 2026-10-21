package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.JobRoleOption;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** A drive's pay line never reads "0 LPA" for pay that isn't set (night audit 13 Oct 2026). */
class DrivePayLineTest {

    private static JobRoleOption option(String ctc, String stipend) {
        JobRoleOption o = new JobRoleOption();
        o.setCtcLpa(ctc == null ? null : new BigDecimal(ctc));
        o.setStipendPerMonth(stipend == null ? null : new BigDecimal(stipend));
        return o;
    }

    @Test
    void ctcFromTheOptionsThatHaveIt() {
        assertEquals("6 LPA", TpoDriveService.ctcRangeOf(List.of(option("6.0", null))));
        assertEquals("4.5-12 LPA", TpoDriveService.ctcRangeOf(List.of(option("12", null), option(null, null), option("4.5", null))));
    }

    @Test
    void aStipendOnlyInternshipShowsTheStipend() {
        assertEquals("₹25,000 a month", TpoDriveService.ctcRangeOf(List.of(option(null, "25000"))));
        assertEquals("₹1,20,000 a month", TpoDriveService.ctcRangeOf(List.of(option("0", "120000"))));
    }

    @Test
    void payNotSetIsEmptyNotZero() {
        assertNull(TpoDriveService.ctcRangeOf(List.of(option(null, null))));
        assertNull(TpoDriveService.ctcRangeOf(List.of(option("0", "0"))));
        assertNull(TpoDriveService.ctcRangeOf(Arrays.asList((JobRoleOption) null)));
        assertNull(TpoDriveService.ctcRangeOf(null));
    }
}
