package com._42students.lms.service.groups;

import com._42students.lms.model.Learner;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.model.groups.LmsGroupRule;
import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.groups.LmsGroupRuleRepository;
import com._42students.lms.service.tpo.EligibilityService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_MANUAL;
import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_RULE;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_ACTIVE;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_REMOVED;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Applying a rule only ever moves RULE-sourced, unlocked rows. Manual/CSV/self members and locked
 * rows are never touched in either direction.
 */
class GroupRuleServiceTest {

    private static final long GROUP_ID = 10L;
    private static final int COLLEGE = 6;

    private final LmsGroupRuleRepository ruleRepo = mock(LmsGroupRuleRepository.class);
    private final LearnerRepository learnerRepo = mock(LearnerRepository.class);
    private final GroupMembershipService membership = mock(GroupMembershipService.class);
    private final EligibilityService eligibility = mock(EligibilityService.class);
    private final GroupRuleService service = new GroupRuleService(ruleRepo, learnerRepo, membership, eligibility);
    private final GroupActor actor = GroupActor.system();

    private static LmsGroup group() {
        LmsGroup g = new LmsGroup();
        g.setId(GROUP_ID);
        g.setCollegeId(COLLEGE);
        g.setStatus(LmsGroup.STATUS_ACTIVE);
        return g;
    }

    private static Learner learner(int id, String dept) {
        Learner l = new Learner();
        l.setId(id);
        l.setCollegeId(COLLEGE);
        l.setDepartment(dept);
        return l;
    }

    private static LmsGroupMember member(int learnerId, String state, String source, boolean locked) {
        LmsGroupMember m = new LmsGroupMember();
        m.setGroupId(GROUP_ID);
        m.setMemberId(learnerId);
        m.setState(state);
        m.setSource(source);
        m.setIsLocked(locked);
        return m;
    }

    private static EligibilityService.EligibilityResult result(boolean eligible) {
        return new EligibilityService.EligibilityResult(eligible, List.of(), false);
    }

    @SuppressWarnings("unchecked")
    @Test void applyAddsNewMatchesRemovesStaleRuleRowsAndLeavesEverythingElseAlone() {
        LmsGroupRule rule = new LmsGroupRule();
        rule.setGroupId(GROUP_ID);
        rule.setCriteriaJson(Map.of("branches", List.of("CSE")));
        when(ruleRepo.findByGroupId(GROUP_ID)).thenReturn(Optional.of(rule));
        when(ruleRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        JobEligibility criteria = new JobEligibility();
        when(eligibility.parseCriteria(any())).thenReturn(criteria);

        // A: new match. B: already a RULE member. C: RULE member that no longer matches.
        // D: MANUAL member that does not match. E: REMOVED + locked, matches again. F: RULE + locked, no longer matches.
        when(learnerRepo.findActiveByCollegeIdForOverrides(COLLEGE)).thenReturn(List.of(
                learner(1, "CSE"), learner(2, "CSE"), learner(3, "ECE"), learner(4, "ECE"), learner(5, "CSE"), learner(6, "ECE")));
        when(eligibility.evaluateRulesAll(eq(criteria), any())).thenAnswer(i -> {
            Map<Integer, EligibilityService.EligibilityResult> out = new java.util.LinkedHashMap<>();
            ((Map<Integer, String>) i.getArgument(1)).forEach((id, branch) -> out.put(id, result("CSE".equals(branch))));
            return out;
        });
        when(membership.members(GROUP_ID, null)).thenReturn(List.of(
                member(2, STATE_ACTIVE, SOURCE_RULE, false),
                member(3, STATE_ACTIVE, SOURCE_RULE, false),
                member(4, STATE_ACTIVE, SOURCE_MANUAL, false),
                member(5, STATE_REMOVED, SOURCE_RULE, true),
                member(6, STATE_ACTIVE, SOURCE_RULE, true)));

        GroupRuleService.ApplyResult r = service.apply(group(), actor);

        assertEquals(3, r.matched, "A, B, E match");
        assertEquals(1, r.added);
        assertEquals(1, r.removed);
        assertEquals(1, r.unchanged);
        assertEquals(2, r.skippedLocked, "E (locked removal) and F (locked stale)");
        verify(membership).add(any(), eq(1), eq(SOURCE_RULE), eq(actor), any());
        verify(membership).remove(any(), eq(3), eq(actor), any(), eq(false));
        verify(membership, never()).remove(any(), eq(4), any(), any(), anyBoolean());
        verify(membership, never()).add(any(), eq(5), any(), any(), any());
        verify(membership, never()).remove(any(), eq(6), any(), any(), anyBoolean());
        assertEquals(3, rule.getLastRunMatched());
    }

    @Test void aGroupWithoutARuleCannotBePreviewed() {
        when(ruleRepo.findByGroupId(GROUP_ID)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.preview(group()));
    }

    @Test void rulesNeedACollegeOwnedGroup() {
        LmsGroup platform = group();
        platform.setCollegeId(null);
        assertThrows(IllegalArgumentException.class, () -> service.set(platform, Map.of("minCgpa", 7.0), false));
        verify(ruleRepo, never()).save(any());
    }

    @Test void archivedGroupsAreNotRefreshed() {
        LmsGroup g = group();
        g.setStatus(LmsGroup.STATUS_ARCHIVED);
        assertThrows(IllegalStateException.class, () -> service.apply(g, actor));
        verify(membership, never()).add(any(), anyInt(), any(), any(), isNull());
    }
}
