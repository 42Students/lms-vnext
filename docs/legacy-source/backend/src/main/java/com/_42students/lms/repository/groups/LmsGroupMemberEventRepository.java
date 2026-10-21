package com._42students.lms.repository.groups;

import com._42students.lms.model.groups.LmsGroupMemberEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LmsGroupMemberEventRepository extends JpaRepository<LmsGroupMemberEvent, Long> {

    List<LmsGroupMemberEvent> findTop200ByGroupIdOrderByCreatedAtDesc(Long groupId);

    List<LmsGroupMemberEvent> findTop100ByMemberTypeAndMemberIdOrderByCreatedAtDesc(String memberType, Integer memberId);
}
