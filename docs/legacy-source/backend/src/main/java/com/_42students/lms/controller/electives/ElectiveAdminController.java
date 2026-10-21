package com._42students.lms.controller.electives;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.electives.ElectiveRequests.AllocateRequest;
import com._42students.lms.dto.electives.ElectiveRequests.FacultyRequest;
import com._42students.lms.dto.electives.ElectiveRequests.OfferingRequest;
import com._42students.lms.dto.electives.ElectiveRequests.RemoveRequest;
import com._42students.lms.dto.electives.ElectiveRequests.SlotRequest;
import com._42students.lms.dto.electives.ElectiveViews.AllocationResult;
import com._42students.lms.dto.electives.ElectiveViews.FacultyView;
import com._42students.lms.dto.electives.ElectiveViews.OfferingView;
import com._42students.lms.dto.electives.ElectiveViews.SlotView;
import com._42students.lms.dto.electives.ElectiveViews.UnallocatedRow;
import com._42students.lms.dto.groups.GroupMemberView;
import com._42students.lms.model.electives.ElectiveOffering;
import com._42students.lms.model.electives.ElectiveSlot;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.ModuleFeatureCatalog;
import com._42students.lms.service.electives.ElectiveService;
import com._42students.lms.service.groups.GroupActor;
import com._42students.lms.service.groups.GroupViewAssembler;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * College-admin and scoped super-admin management of electives. Not under /api/v1/admin/** on
 * purpose: that prefix needs ROLE_ADMIN, which a scoped super-admin also carries, but the tenant
 * check here is the explicit {@code canPerformAdminActionForCollege} on the caller's college, plus
 * the electives module flag for that college.
 */
@RestController
@RequestMapping("/api/v1/electives/admin")
public class ElectiveAdminController {

    private final SecurityContextUtil securityContextUtil;
    private final AccessControlService accessControlService;
    private final FeatureFlagService featureFlagService;
    private final ElectiveService electiveService;
    private final GroupViewAssembler viewAssembler;

    public ElectiveAdminController(SecurityContextUtil securityContextUtil, AccessControlService accessControlService,
                                   FeatureFlagService featureFlagService, ElectiveService electiveService,
                                   GroupViewAssembler viewAssembler) {
        this.securityContextUtil = securityContextUtil;
        this.accessControlService = accessControlService;
        this.featureFlagService = featureFlagService;
        this.electiveService = electiveService;
        this.viewAssembler = viewAssembler;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    /** The college the caller administers; super-admin must have selected one. */
    private Integer college(UserPrincipal p) {
        if (p == null) throw new IllegalArgumentException("Not found");
        Integer collegeId = p.getCollegeId();
        if (collegeId == null) throw new IllegalArgumentException("Select a college first");
        accessControlService.requirePerformAdminActionForCollege(p, collegeId);
        // FeatureFlagService takes the setting key (module.<name>.enabled), not the module name.
        featureFlagService.requireEnabledForCollege(ModuleFeatureCatalog.settingKeyFor(ElectiveService.MODULE), collegeId);
        return collegeId;
    }

    // ------------------------------------------------------------------ slots

    @GetMapping("/slots")
    public ResponseEntity<List<SlotView>> slots(@RequestParam(required = false) Integer programId,
                                                @RequestParam(required = false) Integer semester,
                                                @RequestParam(defaultValue = "false") boolean includeArchived) {
        Integer collegeId = college(principal());
        return ResponseEntity.ok(electiveService.listSlots(collegeId, programId, semester, includeArchived));
    }

    @PostMapping("/slots")
    public ResponseEntity<SlotView> createSlot(@RequestBody SlotRequest body) {
        Integer collegeId = college(principal());
        ElectiveSlot slot = electiveService.createSlot(collegeId, body);
        return ResponseEntity.ok(electiveService.slotDetail(slot));
    }

    @GetMapping("/slots/{slotId}")
    public ResponseEntity<SlotView> slot(@PathVariable Long slotId) {
        Integer collegeId = college(principal());
        return ResponseEntity.ok(electiveService.slotDetail(electiveService.requireSlot(collegeId, slotId)));
    }

    @PutMapping("/slots/{slotId}")
    public ResponseEntity<SlotView> updateSlot(@PathVariable Long slotId, @RequestBody SlotRequest body) {
        Integer collegeId = college(principal());
        ElectiveSlot slot = electiveService.updateSlot(electiveService.requireSlot(collegeId, slotId), body);
        return ResponseEntity.ok(electiveService.slotDetail(slot));
    }

    @PostMapping("/slots/{slotId}/archive")
    public ResponseEntity<SlotView> archiveSlot(@PathVariable Long slotId) {
        Integer collegeId = college(principal());
        ElectiveSlot slot = electiveService.archiveSlot(electiveService.requireSlot(collegeId, slotId));
        return ResponseEntity.ok(electiveService.slotDetail(slot));
    }

    @GetMapping("/slots/{slotId}/unallocated")
    public ResponseEntity<List<UnallocatedRow>> unallocated(@PathVariable Long slotId) {
        Integer collegeId = college(principal());
        return ResponseEntity.ok(electiveService.unallocated(electiveService.requireSlot(collegeId, slotId)));
    }

    // ------------------------------------------------------------------ offerings

    @PostMapping("/slots/{slotId}/offerings")
    public ResponseEntity<OfferingView> createOffering(@PathVariable Long slotId, @RequestBody OfferingRequest body) {
        UserPrincipal p = principal();
        Integer collegeId = college(p);
        ElectiveSlot slot = electiveService.requireSlot(collegeId, slotId);
        ElectiveOffering offering = electiveService.createOffering(slot, body, GroupActor.of(p));
        return ResponseEntity.ok(electiveService.offeringView(offering));
    }

    @GetMapping("/offerings/{offeringId}")
    public ResponseEntity<OfferingView> offering(@PathVariable Long offeringId) {
        Integer collegeId = college(principal());
        return ResponseEntity.ok(electiveService.offeringView(electiveService.requireOffering(collegeId, offeringId)));
    }

    @PutMapping("/offerings/{offeringId}")
    public ResponseEntity<OfferingView> updateOffering(@PathVariable Long offeringId, @RequestBody OfferingRequest body) {
        Integer collegeId = college(principal());
        ElectiveOffering offering = electiveService.updateOffering(electiveService.requireOffering(collegeId, offeringId), body);
        return ResponseEntity.ok(electiveService.offeringView(offering));
    }

    @PostMapping("/offerings/{offeringId}/archive")
    public ResponseEntity<OfferingView> archiveOffering(@PathVariable Long offeringId) {
        Integer collegeId = college(principal());
        ElectiveOffering offering = electiveService.archiveOffering(electiveService.requireOffering(collegeId, offeringId));
        return ResponseEntity.ok(electiveService.offeringView(offering));
    }

    @PutMapping("/offerings/{offeringId}/faculty")
    public ResponseEntity<List<FacultyView>> setFaculty(@PathVariable Long offeringId, @RequestBody FacultyRequest body) {
        Integer collegeId = college(principal());
        ElectiveOffering offering = electiveService.requireOffering(collegeId, offeringId);
        ElectiveSlot slot = electiveService.requireSlot(collegeId, offering.getSlotId());
        return ResponseEntity.ok(electiveService.setFaculty(slot, offering, body.getFacultyIds()));
    }

    // ------------------------------------------------------------------ roster

    @GetMapping("/offerings/{offeringId}/roster")
    public ResponseEntity<List<GroupMemberView>> roster(@PathVariable Long offeringId, @RequestParam(required = false) String state) {
        Integer collegeId = college(principal());
        return ResponseEntity.ok(electiveService.roster(electiveService.requireOffering(collegeId, offeringId), state));
    }

    @PostMapping("/offerings/{offeringId}/allocate")
    public ResponseEntity<AllocationResult> allocate(@PathVariable Long offeringId, @RequestBody AllocateRequest body) {
        UserPrincipal p = principal();
        Integer collegeId = college(p);
        ElectiveOffering offering = electiveService.requireOffering(collegeId, offeringId);
        ElectiveSlot slot = electiveService.requireSlot(collegeId, offering.getSlotId());
        return ResponseEntity.ok(electiveService.allocate(slot, offering, body, GroupActor.of(p)));
    }

    @DeleteMapping("/offerings/{offeringId}/roster/{learnerId}")
    public ResponseEntity<GroupMemberView> remove(@PathVariable Long offeringId, @PathVariable Integer learnerId,
                                                  @RequestBody(required = false) RemoveRequest body) {
        UserPrincipal p = principal();
        Integer collegeId = college(p);
        ElectiveOffering offering = electiveService.requireOffering(collegeId, offeringId);
        boolean lock = body != null && Boolean.TRUE.equals(body.getLock());
        return ResponseEntity.ok(electiveService.remove(offering, learnerId, GroupActor.of(p), body == null ? null : body.getReason(), lock));
    }

    @PostMapping("/offerings/{offeringId}/roster/{learnerId}/move")
    public ResponseEntity<GroupMemberView> move(@PathVariable Long offeringId, @PathVariable Integer learnerId,
                                                @RequestParam Long toOfferingId) {
        UserPrincipal p = principal();
        Integer collegeId = college(p);
        ElectiveOffering from = electiveService.requireOffering(collegeId, offeringId);
        ElectiveOffering to = electiveService.requireOffering(collegeId, toOfferingId);
        LmsGroupMember m = electiveService.move(from, to, learnerId, GroupActor.of(p));
        return ResponseEntity.ok(viewAssembler.memberViews(List.of(m)).get(0));
    }
}
