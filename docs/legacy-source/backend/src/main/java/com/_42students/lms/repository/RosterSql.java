package com._42students.lms.repository;

/**
 * The one definition of "learner l is in class :classId". A learner belongs to a class either
 * because {@code learner.class_id} points at it (a normal section) or because the class is
 * GROUP_BACKED and the learner is an ACTIVE member of its LIVE (non-archived) roster group (an
 * elective offering, later a CRT batch or lab). Native queries that build a class roster must use
 * this fragment so every roster-driven surface (attendance, grading, faculty student lists,
 * scheduling) agrees.
 *
 * The group-status check matters: archiving a group is the documented way access is revoked
 * (see ScopeResolutionService#resolveLearnerToClassIds), but membership rows are never rewritten
 * on archive so history survives. Without also checking group status here, a learner who lost
 * access would still show up in every roster-driven surface forever.
 *
 * The alias of the learner table must be {@code l} and the parameter {@code :classId}.
 */
public final class RosterSql {

    private RosterSql() {
    }

    public static final String LEARNER_IN_CLASS =
            "(l.class_id = :classId OR l.id IN (SELECT m.member_id FROM lms_group_member m "
            + "JOIN class gc ON gc.roster_group_id = m.group_id "
            + "JOIN lms_group g ON g.id = m.group_id "
            + "WHERE gc.id = :classId AND m.member_type = 'LEARNER' AND m.state = 'ACTIVE' "
            + "AND g.status <> 'ARCHIVED' AND (g.is_deleted = false OR g.is_deleted IS NULL)))";
}
