package com._42students.lms.service.tpo;

import com._42students.lms.dto.tpo.DriveForm;
import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.model.tpo.JobRoleOption;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** A drive's numbers must be possible ones; the server used to save whatever came in. */
class DriveFormValuesTest {

    private static DriveForm form(Double minCgpa, BigDecimal ctc) {
        DriveForm f = new DriveForm();
        JobEligibility e = new JobEligibility();
        e.setMinCgpa(minCgpa);
        f.setEligibility(e);
        JobRoleOption o = new JobRoleOption();
        o.setName("Default");
        o.setCtcLpa(ctc);
        f.setRoleOptions(List.of(o));
        return f;
    }

    @Test
    void impossibleNumbersAreRefusedInWords() {
        assertDoesNotThrow(() -> TpoDriveService.checkFormValues(form(7.5, new BigDecimal("6"))));
        assertEquals("Minimum CGPA must be between 0 and 10",
                assertThrows(IllegalArgumentException.class, () -> TpoDriveService.checkFormValues(form(75.0, null))).getMessage());
        assertThrows(IllegalArgumentException.class, () -> TpoDriveService.checkFormValues(form(null, new BigDecimal("-1"))));
    }
}
