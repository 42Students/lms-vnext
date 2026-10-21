package com._42students.lms.service.groups;

import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;

/**
 * The one extension point features use to add their own join/leave rules (an elective's pick
 * limit, a timetable clash, a drop deadline) without the kernel knowing the feature exists.
 * Implement as a Spring bean; the kernel calls every policy whose {@link #supports} says yes.
 *
 * Refuse by throwing {@link IllegalArgumentException} (client error, 400) or
 * {@link IllegalStateException} (conflict with current state, 409).
 */
public interface GroupJoinPolicy {

    boolean supports(LmsGroup group);

    /** Runs before the seat claim. Throw to refuse the join. */
    default void beforeJoin(LmsGroup group, String memberType, Integer memberId, String source) {
    }

    /** Runs before a learner leaves on their own (never for admin removals). Throw to refuse. */
    default void beforeLeave(LmsGroup group, LmsGroupMember member) {
    }
}
