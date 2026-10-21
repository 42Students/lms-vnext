package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.JobRound;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/** BE-0054 (S0): a drive save may only write its own rounds; a round id from another drive or college is refused. */
class DriveRoundOwnershipTest {

    private static JobRound roundOf(int jobId) {
        JobRound r = new JobRound();
        r.setId(77L);
        r.setJobId(jobId);
        return r;
    }

    @Test
    void aRoundWithoutAnIdIsNew() {
        JobRound r = TpoDriveService.roundForSave(null, null, 10);
        assertNull(r.getId());
    }

    @Test
    void aRoundOfThisDriveIsUpdatedInPlace() {
        JobRound own = roundOf(10);
        assertSame(own, TpoDriveService.roundForSave(Optional.of(own), 77L, 10));
    }

    @Test
    void anotherDrivesRoundIsRefusedAndNotMoved() {
        JobRound foreign = roundOf(99); // another drive, possibly another college
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> TpoDriveService.roundForSave(Optional.of(foreign), 77L, 10));
        assertEquals("Round not found on this drive", e.getMessage());
        assertEquals(99, foreign.getJobId(), "the foreign round keeps its drive");
    }

    @Test
    void anUnknownIdIsRefusedTheSameWay() {
        assertEquals("Round not found on this drive",
                assertThrows(IllegalArgumentException.class, () -> TpoDriveService.roundForSave(Optional.empty(), 77L, 10)).getMessage());
    }

    @Test
    void aRoundIdSentWhileCreatingADriveIsRefused() {
        // createDraft saves the new drive first; a body round id can never already belong to it.
        assertThrows(IllegalArgumentException.class, () -> TpoDriveService.roundForSave(Optional.of(roundOf(99)), 77L, 500));
    }
}
