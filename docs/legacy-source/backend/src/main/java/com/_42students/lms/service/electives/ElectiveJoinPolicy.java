package com._42students.lms.service.electives;

import com._42students.lms.model.electives.ElectiveOffering;
import com._42students.lms.model.electives.ElectiveSlot;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.electives.ElectiveOfferingRepository;
import com._42students.lms.repository.electives.ElectiveSlotRepository;
import com._42students.lms.repository.groups.LmsGroupMemberRepository;
import com._42students.lms.service.groups.GroupJoinPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * The slot rule, enforced at the one place a learner can enter an elective group: a learner holds
 * at most {@code slot.maxPick} offerings of a slot, and an archived offering takes nobody. The
 * kernel calls this for every join into a group of kind ELECTIVE; the kernel itself knows nothing
 * about slots.
 */
@Component
@RequiredArgsConstructor
public class ElectiveJoinPolicy implements GroupJoinPolicy {

    public static final String KIND = "ELECTIVE";

    private final ElectiveOfferingRepository offeringRepository;
    private final ElectiveSlotRepository slotRepository;
    private final LmsGroupMemberRepository memberRepository;

    // BE-0081: optional so hand-built policies in tests keep working; in the app it is always there.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;

    @Override
    public boolean supports(LmsGroup group) {
        return group != null && KIND.equals(group.getKind());
    }

    @Override
    public void beforeJoin(LmsGroup group, String memberType, Integer memberId, String source) {
        Optional<ElectiveOffering> offeringOpt = offeringRepository.findByGroupIdAndIsDeletedFalse(group.getId());
        if (offeringOpt.isEmpty()) return; // an ELECTIVE group not (yet) bound to an offering carries no slot rule
        ElectiveOffering offering = offeringOpt.get();
        if (!ElectiveOffering.STATUS_ACTIVE.equals(offering.getStatus())) {
            throw new IllegalStateException("This elective offering is archived");
        }
        ElectiveSlot slot = slotRepository.findByIdAndIsDeletedFalse(offering.getSlotId())
                .orElseThrow(() -> new IllegalStateException("Elective slot not found"));
        if (!ElectiveSlot.STATUS_ACTIVE.equals(slot.getStatus())) {
            throw new IllegalStateException("This elective slot is archived");
        }
        int maxPick = slot.getMaxPick() == null ? 1 : slot.getMaxPick();
        List<Long> siblingGroupIds = offeringRepository.findBySlotIdAndIsDeletedFalseOrderByIdAsc(slot.getId()).stream()
                .filter(o -> !o.getId().equals(offering.getId()))
                // Archived offerings preserve membership history, but they no longer grant access
                // and must not keep consuming a learner's pick allowance forever.
                .filter(o -> ElectiveOffering.STATUS_ACTIVE.equals(o.getStatus()))
                .map(ElectiveOffering::getGroupId)
                .collect(Collectors.toList());
        if (siblingGroupIds.isEmpty()) return;
        long held;
        if (jdbc != null) {
            // BE-0081: joins into different offerings of one slot take turns on the slot row, and the picks already held are
            // counted from the latest committed rows (FOR UPDATE), so two parallel allocations can't both see "none yet".
            jdbc.queryForList("SELECT id FROM elective_slot WHERE id = :s FOR UPDATE", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("s", slot.getId()));
            Long n = jdbc.queryForObject("SELECT COUNT(*) FROM lms_group_member WHERE member_type = :t AND member_id = :m AND group_id IN (:g) " +
                            "AND state IN ('" + LmsGroupMember.STATE_ACTIVE + "', '" + LmsGroupMember.STATE_WAITLISTED + "') FOR UPDATE",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("t", memberType).addValue("m", memberId).addValue("g", siblingGroupIds), Long.class);
            held = n == null ? 0 : n;
        } else {
            held = memberRepository.findByMemberInGroups(memberType, memberId, siblingGroupIds).stream()
                    .filter(m -> LmsGroupMember.STATE_ACTIVE.equals(m.getState()) || LmsGroupMember.STATE_WAITLISTED.equals(m.getState()))
                    .count();
        }
        if (held >= maxPick) {
            throw new IllegalStateException("Already allocated to " + held + " offering" + (held == 1 ? "" : "s")
                    + " of " + slot.getName() + " (max " + maxPick + "). Move the student instead.");
        }
    }
}
