package com._42students.lms.service;

import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.College;
import com._42students.lms.model.Learner;
import com._42students.lms.model.Organization;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Resolves NotificationTemplateContext based on business entities.
 * Resolves notification template context; currently always returns LMS.
 */
@Component
@Slf4j
public class NotificationTemplateContextResolver {
    
    @Autowired
    private CollegeRepository collegeRepository;
    
    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ScopeResolutionService scopeResolutionService;
    
    /**
     * Determine context based on college ID
     * @param collegeId College ID
     * @return notification template context
     */
    public NotificationTemplateContext getContextForCollege(Integer collegeId) {
        return NotificationTemplateContext.LMS;
    }
    
    /**
     * Determine context based on organization ID
     * @param orgId Organization ID
     * @return notification template context
     */
    public NotificationTemplateContext getContextForOrganization(Integer orgId) {
        return NotificationTemplateContext.LMS;
    }
    
    /**
     * Determine context based on learner. Resolves collegeId from hierarchy if not set directly.
     * @param learner Learner entity
     * @return notification template context
     */
    public NotificationTemplateContext getContextForLearner(Learner learner) {
        if (learner == null) {
            return NotificationTemplateContext.LMS;
        }
        Integer collegeId = learner.getCollegeId();
        if (collegeId == null) {
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learner);
            collegeId = scope.getCollegeId();
        }
        return getContextForCollege(collegeId);
    }
}


