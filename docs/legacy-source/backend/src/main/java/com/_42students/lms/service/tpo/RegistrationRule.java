package com._42students.lms.service.tpo;

/**
 * Who counts as registered for placements without having chosen (owner, 19 Oct 2026): a student who applied to a drive before
 * their college first invited a batch to register. They applied under the old rules, so they keep counting as Placements.
 * An application made after that (by the student or on their behalf) does not register anyone: they register like everyone else.
 * A college that has never invited a batch does not use registration, so any application counts there.
 *
 * One rule for the apply check (ApplyGate) and every count of registered students (Students page, insights, announcements,
 * drive audiences). It used to be "any application, ever", so a student the placement cell applied for on their behalf after
 * registration started counted as registered everywhere.
 */
final class RegistrationRule {

    private RegistrationRule() {}

    /** When learner l's college first invited a batch to register; far in the future when it never has. */
    static final String FIRST_INVITE_OF_L = "COALESCE((SELECT MIN(pbx.invited_at) FROM placement_batch pbx JOIN batch bx ON bx.id = pbx.batch_id " +
            "JOIN new_program px ON px.id = bx.program_id JOIN department dx ON dx.id = px.dept_id WHERE dx.college_id = l.college_id), '9999-12-31')";

    /** SQL for learner alias l: 'PLACEMENTS' when an application of theirs predates registration, else NULL. */
    static final String APPLIED_EARLIER = "(CASE WHEN EXISTS (SELECT 1 FROM job_application ax WHERE ax.learner_id = l.id " +
            "AND (ax.is_deleted = 0 OR ax.is_deleted IS NULL) AND (ax.applied_at IS NULL OR ax.applied_at < " + FIRST_INVITE_OF_L + ")) " +
            "THEN 'PLACEMENTS' END)";
}
