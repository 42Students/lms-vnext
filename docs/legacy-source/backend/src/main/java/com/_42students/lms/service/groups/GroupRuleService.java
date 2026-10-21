package com._42students.lms.service.groups;

import com._42students.lms.model.Learner;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.model.groups.LmsGroupRule;
import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.groups.LmsGroupRuleRepository;
import com._42students.lms.service.tpo.EligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_RULE;

/**
 * Rule-based membership. A rule is the same criteria object placements use
 * ({@link JobEligibility}), evaluated by the same {@link EligibilityService}, so "CGPA >= 7, CSE,
 * no backlogs" meant one thing everywhere (backlog rules are no longer checked: the LMS has no source for them).
 *
 * Applying a rule materialises members with {@code source=RULE}. It never touches members from any
 * other source and never touches a locked row, in either direction: a locked RULE member stays even
 * if they stop matching; a locked REMOVED row is never re-added.
 */
@Service
@RequiredArgsConstructor
public class GroupRuleService {

    private final LmsGroupRuleRepository ruleRepository;
    private final LearnerRepository learnerRepository;
    private final GroupMembershipService membershipService;
    private final EligibilityService eligibilityService;

    public static class Match {
        public final Integer learnerId;
        public final String name;
        public final String rollNumber;
        public final String department;
        public final boolean eligible;
        public final List<EligibilityService.RuleCheck> checks;

        Match(Learner l, EligibilityService.EligibilityResult r) {
            this.learnerId = l.getId();
            String first = l.getFirstName() == null ? "" : l.getFirstName();
            String last = l.getLastName() == null ? "" : l.getLastName();
            this.name = (first + " " + last).trim();
            this.rollNumber = l.getRollNumber();
            this.department = l.getDepartment();
            this.eligible = r.eligible;
            this.checks = r.checks;
        }
    }

    public static class Preview {
        public final int evaluated;
        public final int matched;
        public final List<Match> matches;

        Preview(int evaluated, List<Match> matches) {
            this.evaluated = evaluated;
            this.matched = matches.size();
            this.matches = matches;
        }
    }

    public static class ApplyResult {
        public int matched;
        public int added;
        public int removed;
        public int skippedLocked;
        /** Refused by a feature policy (e.g. already holds another offering of the elective slot). */
        public int skippedPolicy;
        public int unchanged;
        public List<String> policyMessages = new ArrayList<>();
    }

    public Optional<LmsGroupRule> get(Long groupId) {
        return ruleRepository.findByGroupId(groupId);
    }

    @Transactional
    public LmsGroupRule set(LmsGroup group, Object criteriaJson, Boolean autoRefresh) {
        if (group.isPlatformOwned()) throw new IllegalArgumentException("Rules need a college-owned group");
        if (criteriaJson == null) throw new IllegalArgumentException("Criteria are required");
        eligibilityService.parseCriteria(criteriaJson); // rejects a malformed shape before it is stored
        LmsGroupRule rule = ruleRepository.findByGroupId(group.getId()).orElseGet(LmsGroupRule::new);
        rule.setGroupId(group.getId());
        rule.setCriteriaJson(criteriaJson);
        rule.setAutoRefresh(Boolean.TRUE.equals(autoRefresh));
        return ruleRepository.save(rule);
    }

    @Transactional
    public void clear(LmsGroup group) {
        ruleRepository.findByGroupId(group.getId()).ifPresent(ruleRepository::delete);
    }

    /** Evaluate without changing anything. Only eligible learners are returned. */
    public Preview preview(LmsGroup group) {
        LmsGroupRule rule = ruleRepository.findByGroupId(group.getId())
                .orElseThrow(() -> new IllegalArgumentException("This group has no rule"));
        if (group.getCollegeId() == null) throw new IllegalArgumentException("Rules need a college-owned group");
        JobEligibility criteria = eligibilityService.parseCriteria(rule.getCriteriaJson());
        List<Learner> learners = learnerRepository.findActiveByCollegeIdForOverrides(group.getCollegeId());
        Map<Integer, String> branchById = new java.util.LinkedHashMap<>();
        for (Learner learner : learners) branchById.put(learner.getId(), learner.getDepartment());
        Map<Integer, EligibilityService.EligibilityResult> results = eligibilityService.evaluateRulesAll(criteria, branchById);
        List<Match> matches = new ArrayList<>();
        for (Learner learner : learners) {
            EligibilityService.EligibilityResult result = results.get(learner.getId());
            if (result.eligible) matches.add(new Match(learner, result));
        }
        return new Preview(learners.size(), matches);
    }

    /**
     * Not @Transactional on purpose: every add/remove commits in the membership service's own
     * transaction, so a learner a feature policy refuses (e.g. the elective slot rule) is counted
     * and skipped instead of poisoning one big transaction with a rollback-only mark.
     */
    public ApplyResult apply(LmsGroup group, GroupActor actor) {
        if (LmsGroup.STATUS_ARCHIVED.equals(group.getStatus())) throw new IllegalStateException("Group is archived");
        Preview preview = preview(group);
        Map<Integer, LmsGroupMember> existing = new HashMap<>();
        for (LmsGroupMember m : membershipService.members(group.getId(), null)) existing.put(m.getMemberId(), m);

        ApplyResult result = new ApplyResult();
        result.matched = preview.matched;
        Map<Integer, Boolean> matchedIds = new HashMap<>();
        for (Match match : preview.matches) {
            matchedIds.put(match.learnerId, Boolean.TRUE);
            LmsGroupMember current = existing.get(match.learnerId);
            if (current != null && current.isCurrent()) {
                result.unchanged++;
                continue;
            }
            if (current != null && Boolean.TRUE.equals(current.getIsLocked())) {
                result.skippedLocked++;
                continue;
            }
            try {
                membershipService.add(group, match.learnerId, SOURCE_RULE, actor, "Matched rule");
                result.added++;
            } catch (IllegalArgumentException | IllegalStateException refused) {
                result.skippedPolicy++;
                if (result.policyMessages.size() < 50) {
                    result.policyMessages.add((match.rollNumber != null ? match.rollNumber : "#" + match.learnerId) + ": " + refused.getMessage());
                }
            }
        }
        for (LmsGroupMember m : existing.values()) {
            if (!SOURCE_RULE.equals(m.getSource()) || !m.isCurrent() || matchedIds.containsKey(m.getMemberId())) continue;
            if (Boolean.TRUE.equals(m.getIsLocked())) {
                result.skippedLocked++;
                continue;
            }
            membershipService.remove(group, m.getMemberId(), actor, "No longer matches rule", false);
            result.removed++;
        }
        LmsGroupRule rule = ruleRepository.findByGroupId(group.getId()).orElseThrow();
        rule.setLastRunAt(LocalDateTime.now());
        rule.setLastRunMatched(preview.matched);
        ruleRepository.save(rule);
        return result;
    }
}
