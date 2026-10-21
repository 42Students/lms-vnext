package com._42students.lms.service.groups;

import com._42students.lms.dto.groups.GroupUpsertRequest;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.repository.groups.LmsGroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GroupServiceTest {

    private final LmsGroupRepository repo = mock(LmsGroupRepository.class);
    private final GroupMembershipService membership = mock(GroupMembershipService.class);
    private final GroupService service = new GroupService(repo, membership);
    private final GroupActor actor = GroupActor.system();

    @BeforeEach
    void setUp() {
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private static GroupUpsertRequest request(String kind, String name) {
        GroupUpsertRequest r = new GroupUpsertRequest();
        r.setKind(kind);
        r.setName(name);
        return r;
    }

    @Test void createNormalisesKindAndScopesToTheCollege() {
        LmsGroup g = service.create(actor, 6, request(" elective ", " Sem 5 PE-1 "));

        assertEquals("ELECTIVE", g.getKind());
        assertEquals("Sem 5 PE-1", g.getName());
        assertEquals(6, g.getCollegeId());
        assertEquals(LmsGroup.SCOPE_COLLEGE, g.getOwnerScope());
        assertEquals(LmsGroup.STATUS_DRAFT, g.getStatus());
    }

    @Test void createWithoutACollegeIsPlatformOwned() {
        assertEquals(LmsGroup.SCOPE_PLATFORM, service.create(actor, null, request("BUS", "Route 7")).getOwnerScope());
    }

    @Test void kindMustBeAnIdentifier() {
        assertThrows(IllegalArgumentException.class, () -> service.create(actor, 6, request("bus route", "x")));
        assertThrows(IllegalArgumentException.class, () -> service.create(actor, 6, request("", "x")));
        assertThrows(IllegalArgumentException.class, () -> service.create(actor, 6, request(null, "x")));
    }

    @Test void kindCannotChangeAfterCreate() {
        LmsGroup g = service.create(actor, 6, request("ELECTIVE", "x"));
        assertThrows(IllegalArgumentException.class, () -> service.update(g, request("CRT", "x")));
        assertEquals("x", service.update(g, request("elective", "x")).getName(), "same kind in any case is fine");
    }

    @Test void capacityCannotDropBelowActiveMembers() {
        LmsGroup g = service.create(actor, 6, request("ELECTIVE", "x"));
        g.setActiveCount(12);
        GroupUpsertRequest r = request(null, "x");
        r.setCapacity(10);
        assertThrows(IllegalStateException.class, () -> service.update(g, r));
        r.setCapacity(12);
        assertEquals(12, service.update(g, r).getCapacity());
    }

    @Test void windowMustBeOrdered() {
        GroupUpsertRequest r = request("ELECTIVE", "x");
        r.setSelfJoinOpenFrom(LocalDateTime.of(2026, 8, 10, 0, 0));
        r.setSelfJoinOpenUntil(LocalDateTime.of(2026, 8, 1, 0, 0));
        assertThrows(IllegalArgumentException.class, () -> service.create(actor, 6, r));
    }

    @Test void statusMachine() {
        LmsGroup g = service.create(actor, 6, request("ELECTIVE", "x"));
        assertThrows(IllegalStateException.class, () -> service.transition(g, "CLOSED"), "DRAFT cannot close");
        assertEquals("ACTIVE", service.transition(g, "active").getStatus());
        assertEquals("CLOSED", service.transition(g, "CLOSED").getStatus());
        assertEquals("ACTIVE", service.transition(g, "ACTIVE").getStatus(), "reopen is allowed");
        assertEquals("ARCHIVED", service.transition(g, "ARCHIVED").getStatus());
        assertThrows(IllegalStateException.class, () -> service.transition(g, "ACTIVE"), "ARCHIVED is terminal");
        assertThrows(IllegalStateException.class, () -> service.update(g, request(null, "y")), "archived is read-only");
    }

    @Test void deleteOnlyFromDraftOrArchived() {
        LmsGroup g = service.create(actor, 6, request("ELECTIVE", "x"));
        service.transition(g, "ACTIVE");
        assertThrows(IllegalStateException.class, () -> service.softDelete(g));
        service.transition(g, "ARCHIVED");
        service.softDelete(g);
        assertTrue(g.getIsDeleted());
    }

    @Test void capacityIncreasedHelper() {
        assertTrue(GroupService.capacityIncreased(5, 10), "raised");
        assertTrue(GroupService.capacityIncreased(5, null), "now unlimited");
        assertTrue(!GroupService.capacityIncreased(10, 5), "lowered");
        assertTrue(!GroupService.capacityIncreased(5, 5), "unchanged");
        assertTrue(!GroupService.capacityIncreased(null, 5), "was already unlimited: cannot increase further");
        assertTrue(!GroupService.capacityIncreased(null, null), "unchanged, both unlimited");
    }

    @Test void raisingCapacityPromotesTheWaitlist() {
        LmsGroup g = service.create(actor, 6, request("ELECTIVE", "x"));
        g.setCapacity(5);
        g.setActiveCount(5);
        GroupUpsertRequest r = request(null, "x");
        r.setCapacity(10);

        service.update(g, r);

        verify(membership).promoteWhileSeatsAvailable(g);
    }

    @Test void loweringOrUnchangedCapacityDoesNotTriggerPromotion() {
        LmsGroup g = service.create(actor, 6, request("ELECTIVE", "x"));
        g.setCapacity(10);
        g.setActiveCount(5);
        GroupUpsertRequest same = request(null, "x");
        same.setCapacity(10);
        service.update(g, same);
        GroupUpsertRequest lower = request(null, "x");
        lower.setCapacity(6);
        service.update(g, lower);

        verify(membership, never()).promoteWhileSeatsAvailable(any());
    }
}
