package com._42students.lms.service.groups;

import com._42students.lms.security.UserPrincipal;

/** Who caused a membership change, as recorded on lms_group_member_event. */
public final class GroupActor {

    public final String type;
    public final Integer id;

    private GroupActor(String type, Integer id) {
        this.type = type;
        this.id = id;
    }

    public static GroupActor of(UserPrincipal principal) {
        if (principal == null) return system();
        if (principal.getId() != null && principal.getId() == 0) return new GroupActor("SUPER_ADMIN", 0);
        return new GroupActor(principal.getUserType(), principal.getId());
    }

    /** Waitlist promotion, rule re-runs: no person behind the change. */
    public static GroupActor system() {
        return new GroupActor("SYSTEM", null);
    }
}
