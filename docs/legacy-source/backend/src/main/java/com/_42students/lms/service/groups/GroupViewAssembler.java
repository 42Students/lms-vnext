package com._42students.lms.service.groups;

import com._42students.lms.dto.groups.GroupMemberView;
import com._42students.lms.model.Learner;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Decorates member rows with the learner fields an admin roster needs. */
@Component
@RequiredArgsConstructor
public class GroupViewAssembler {

    private final LearnerRepository learnerRepository;

    public List<GroupMemberView> memberViews(List<LmsGroupMember> members) {
        List<Integer> ids = members.stream().map(LmsGroupMember::getMemberId).distinct().collect(Collectors.toList());
        Map<Integer, Learner> learners = new HashMap<>();
        if (!ids.isEmpty()) learnerRepository.findAllById(ids).forEach(l -> learners.put(l.getId(), l));
        List<GroupMemberView> views = new ArrayList<>(members.size());
        for (LmsGroupMember m : members) views.add(GroupMemberView.of(m, learners.get(m.getMemberId())));
        return views;
    }
}
