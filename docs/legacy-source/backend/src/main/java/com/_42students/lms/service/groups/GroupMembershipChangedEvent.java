package com._42students.lms.service.groups;

/**
 * Published by {@link GroupMembershipService} on every membership state change (join, waitlist,
 * promotion, removal, lock), inside the same transaction. It names no feature, so the kernel rule
 * "features point at groups; groups never point at features" still holds: a feature that owns a
 * group (e.g. a project team) listens and keeps its own records in step.
 */
public final class GroupMembershipChangedEvent {

    private final Long groupId;
    private final String memberType;
    private final Integer memberId;
    private final String fromState;
    private final String toState;

    public GroupMembershipChangedEvent(Long groupId, String memberType, Integer memberId, String fromState, String toState) {
        this.groupId = groupId;
        this.memberType = memberType;
        this.memberId = memberId;
        this.fromState = fromState;
        this.toState = toState;
    }

    public Long getGroupId() { return groupId; }
    public String getMemberType() { return memberType; }
    public Integer getMemberId() { return memberId; }
    public String getFromState() { return fromState; }
    public String getToState() { return toState; }
}
