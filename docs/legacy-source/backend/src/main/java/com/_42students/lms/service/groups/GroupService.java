package com._42students.lms.service.groups;

import com._42students.lms.dto.groups.GroupUpsertRequest;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.repository.groups.LmsGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com._42students.lms.model.groups.LmsGroup.STATUS_ACTIVE;
import static com._42students.lms.model.groups.LmsGroup.STATUS_ARCHIVED;
import static com._42students.lms.model.groups.LmsGroup.STATUS_CLOSED;
import static com._42students.lms.model.groups.LmsGroup.STATUS_DRAFT;

/**
 * Group lifecycle. Deliberately knows nothing about what a group is for: {@code kind} is validated
 * as an identifier and stored, {@code configJson} is stored as given.
 *
 * Status: DRAFT -> ACTIVE <-> CLOSED, any -> ARCHIVED (terminal). Only ACTIVE accepts self-join;
 * admins may build a roster in DRAFT. Deleting is soft and only from DRAFT or ARCHIVED.
 */
@Service
@RequiredArgsConstructor
public class GroupService {

    private static final Pattern KIND = Pattern.compile("[A-Z][A-Z0-9_]{1,39}");
    private static final Map<String, Set<String>> TRANSITIONS = Map.of(
            STATUS_DRAFT, Set.of(STATUS_ACTIVE, STATUS_ARCHIVED),
            STATUS_ACTIVE, Set.of(STATUS_CLOSED, STATUS_ARCHIVED),
            STATUS_CLOSED, Set.of(STATUS_ACTIVE, STATUS_ARCHIVED),
            STATUS_ARCHIVED, Set.of());

    private final LmsGroupRepository groupRepository;
    private final GroupMembershipService membershipService;

    public LmsGroup get(Long id) {
        if (id == null) throw new IllegalArgumentException("Group not found");
        return groupRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
    }

    /** {@code collegeId == null} lists platform-owned groups (super-admin only; the guard enforces that). */
    public List<LmsGroup> list(Integer collegeId, String kind, String status) {
        String k = normaliseKind(kind);
        List<LmsGroup> groups;
        if (collegeId == null) {
            groups = groupRepository.findByCollegeIdIsNullAndIsDeletedFalseOrderByCreatedAtDesc();
            if (k != null) groups = groups.stream().filter(g -> k.equals(g.getKind())).collect(Collectors.toList());
        } else if (k == null) {
            groups = groupRepository.findByCollegeIdAndIsDeletedFalseOrderByCreatedAtDesc(collegeId);
        } else {
            groups = groupRepository.findByCollegeIdAndKindAndIsDeletedFalseOrderByCreatedAtDesc(collegeId, k);
        }
        if (status != null && !status.isBlank()) {
            String s = status.trim().toUpperCase(Locale.ROOT);
            groups = groups.stream().filter(g -> s.equals(g.getStatus())).collect(Collectors.toList());
        }
        return groups;
    }

    @Transactional
    public LmsGroup create(GroupActor actor, Integer collegeId, GroupUpsertRequest request) {
        LmsGroup group = new LmsGroup();
        group.setKind(requireKind(request.getKind()));
        group.setCollegeId(collegeId);
        group.setOwnerScope(collegeId == null ? LmsGroup.SCOPE_PLATFORM : LmsGroup.SCOPE_COLLEGE);
        group.setCreatedByType(actor.type);
        group.setCreatedById(actor.id);
        applyEditable(group, request);
        return groupRepository.save(group);
    }

    @Transactional
    public LmsGroup update(LmsGroup group, GroupUpsertRequest request) {
        if (STATUS_ARCHIVED.equals(group.getStatus())) throw new IllegalStateException("An archived group cannot be edited");
        String kind = normaliseKind(request.getKind());
        if (kind != null && !kind.equals(group.getKind())) throw new IllegalArgumentException("Kind cannot be changed once created");
        Integer previousCapacity = group.getCapacity();
        applyEditable(group, request);
        LmsGroup saved = groupRepository.save(group);
        // Raising (or unsetting) capacity never promotes on its own — only a departure does
        // (see promoteWhileSeatsAvailable's javadoc) — so a full group with a waitlist would
        // otherwise stay stuck at the old capacity until someone happened to leave.
        if (capacityIncreased(previousCapacity, saved.getCapacity())) membershipService.promoteWhileSeatsAvailable(saved);
        return saved;
    }

    /** True only when the new capacity can admit more people than the old one could. */
    public static boolean capacityIncreased(Integer previous, Integer updated) {
        if (java.util.Objects.equals(previous, updated)) return false;
        if (updated == null) return true; // now unlimited
        if (previous == null) return false; // was unlimited: cannot "increase" past that, and an unlimited group never waitlists anyway
        return updated > previous;
    }

    @Transactional
    public LmsGroup transition(LmsGroup group, String to) {
        String target = to == null ? "" : to.trim().toUpperCase(Locale.ROOT);
        if (!TRANSITIONS.getOrDefault(group.getStatus(), Set.of()).contains(target)) {
            throw new IllegalStateException("Cannot move a " + group.getStatus() + " group to " + (target.isEmpty() ? "(none)" : target));
        }
        group.setStatus(target);
        return groupRepository.save(group);
    }

    @Transactional
    public void softDelete(LmsGroup group) {
        if (!STATUS_DRAFT.equals(group.getStatus()) && !STATUS_ARCHIVED.equals(group.getStatus())) {
            throw new IllegalStateException("Archive the group before deleting it");
        }
        group.setIsDeleted(true);
        groupRepository.save(group);
    }

    private static void applyEditable(LmsGroup group, GroupUpsertRequest r) {
        String name = r.getName() == null ? "" : r.getName().trim();
        if (name.isEmpty()) throw new IllegalArgumentException("Name is required");
        if (name.length() > 150) throw new IllegalArgumentException("Name must be 150 characters or fewer");
        group.setName(name);

        String description = r.getDescription() == null ? null : r.getDescription().trim();
        if (description != null && description.length() > 1000) throw new IllegalArgumentException("Description must be 1000 characters or fewer");
        group.setDescription(description == null || description.isEmpty() ? null : description);

        if (r.getCapacity() != null) {
            if (r.getCapacity() < 1) throw new IllegalArgumentException("Capacity must be at least 1, or empty for unlimited");
            int active = group.getActiveCount() == null ? 0 : group.getActiveCount();
            if (r.getCapacity() < active) {
                throw new IllegalStateException("Capacity cannot go below the current active members (" + active + ")");
            }
        }
        group.setCapacity(r.getCapacity());

        if (r.getSelfJoinOpenFrom() != null && r.getSelfJoinOpenUntil() != null
                && r.getSelfJoinOpenFrom().isAfter(r.getSelfJoinOpenUntil())) {
            throw new IllegalArgumentException("Self-join window must start before it ends");
        }
        group.setSelfJoinOpenFrom(r.getSelfJoinOpenFrom());
        group.setSelfJoinOpenUntil(r.getSelfJoinOpenUntil());

        String year = r.getAcademicYear() == null ? null : r.getAcademicYear().trim();
        if (year != null && year.length() > 20) throw new IllegalArgumentException("Academic year must be 20 characters or fewer");
        group.setAcademicYear(year == null || year.isEmpty() ? null : year);

        if (r.getSemesterNumber() != null && (r.getSemesterNumber() < 1 || r.getSemesterNumber() > 12)) {
            throw new IllegalArgumentException("Semester must be between 1 and 12");
        }
        group.setSemesterNumber(r.getSemesterNumber());
        group.setConfigJson(r.getConfigJson());
    }

    public static String normaliseKind(String kind) {
        if (kind == null) return null;
        String k = kind.trim().toUpperCase(Locale.ROOT);
        return k.isEmpty() ? null : k;
    }

    private static String requireKind(String kind) {
        String k = normaliseKind(kind);
        if (k == null || !KIND.matcher(k).matches()) {
            throw new IllegalArgumentException("Kind must be an upper-case identifier such as ELECTIVE (letters, digits, underscore)");
        }
        return k;
    }
}
