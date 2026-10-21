package com._42students.lms.integration;

import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.model.groups.LmsGroupMemberEvent;
import com._42students.lms.repository.groups.LmsGroupMemberEventRepository;
import com._42students.lms.repository.groups.LmsGroupMemberRepository;
import com._42students.lms.repository.groups.LmsGroupRepository;
import com._42students.lms.service.groups.GroupActor;
import com._42students.lms.service.groups.GroupMembershipService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

/**
 * Fault-injection proof that group counter/member/event writes are one transaction.
 */
class GroupTransactionRollbackMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 109401;
    private static final int LEARNER = 109411;

    @Autowired
    private LmsGroupRepository groups;

    @Autowired
    private LmsGroupMemberRepository members;

    @Autowired
    private GroupMembershipService membershipService;

    @SpyBean
    private LmsGroupMemberEventRepository events;

    private Long groupId;

    @AfterEach
    void cleanup() {
        if (groupId != null) {
            jdbc.update("delete from lms_group_member_event where group_id = ?", groupId);
            jdbc.update("delete from lms_group_member where group_id = ?", groupId);
            jdbc.update("delete from lms_group_rule where group_id = ?", groupId);
            jdbc.update("delete from lms_group where id = ?", groupId);
        }
        jdbc.update("delete from learner where id = ?", LEARNER);
        jdbc.update("delete from college where id = ?", COLLEGE);
    }

    private LmsGroup seedGroup() {
        seedCollege(COLLEGE, "Rollback College");
        seedLearner(LEARNER, COLLEGE, "RollbackLearner");

        LmsGroup group = new LmsGroup();
        group.setKind("GENERIC");
        group.setOwnerScope(LmsGroup.SCOPE_COLLEGE);
        group.setCollegeId(COLLEGE);
        group.setName("Rollback Group");
        group.setStatus(LmsGroup.STATUS_ACTIVE);
        group.setCapacity(1);
        group.setActiveCount(0);
        group.setSelfJoinOpenFrom(LocalDateTime.now().minusMinutes(1));
        group.setSelfJoinOpenUntil(LocalDateTime.now().plusMinutes(10));
        group.setConfigJson(Map.of("allowWaitlist", true, "allowSelfLeave", true));
        group.setCreatedByType("SYSTEM");
        group.setIsDeleted(false);
        group = groups.saveAndFlush(group);
        groupId = group.getId();
        return group;
    }

    @Test
    void eventWriteFailureRollsBackSeatClaimAndMembershipInsert() {
        LmsGroup group = seedGroup();
        doThrow(new RuntimeException("synthetic event failure"))
                .when(events).save(any(LmsGroupMemberEvent.class));

        assertThrows(RuntimeException.class,
                () -> membershipService.selfJoin(group, LEARNER, GroupActor.system()));

        assertEquals(0, groups.findById(groupId).orElseThrow().getActiveCount(),
                "seat claim must roll back when append-only event write fails");
        assertEquals(0, members.findByGroupIdOrderByCreatedAtAsc(groupId).size(),
                "membership row must roll back with the failed event");
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from lms_group_member_event where group_id = ?",
                Integer.class, groupId));
    }

    @Test
    void eventWriteFailureDuringLeaveRestoresMemberAndSeatCounter() {
        LmsGroup group = seedGroup();
        membershipService.selfJoin(group, LEARNER, GroupActor.system());

        doThrow(new RuntimeException("synthetic leave event failure"))
                .when(events).save(any(LmsGroupMemberEvent.class));

        assertThrows(RuntimeException.class,
                () -> membershipService.leave(group, LEARNER, GroupActor.system()));

        LmsGroupMember member = members.findByGroupIdAndMemberTypeAndMemberId(
                groupId, LmsGroupMember.TYPE_LEARNER, LEARNER).orElseThrow();
        assertEquals(LmsGroupMember.STATE_ACTIVE, member.getState(),
                "failed leave must not persist REMOVED");
        assertEquals(1, groups.findById(groupId).orElseThrow().getActiveCount(),
                "released seat must roll back when the event write fails");
    }
}
