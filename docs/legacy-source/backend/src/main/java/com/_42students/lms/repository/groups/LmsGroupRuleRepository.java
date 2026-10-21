package com._42students.lms.repository.groups;

import com._42students.lms.model.groups.LmsGroupRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LmsGroupRuleRepository extends JpaRepository<LmsGroupRule, Long> {

    Optional<LmsGroupRule> findByGroupId(Long groupId);
}
