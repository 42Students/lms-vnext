package com._42students.lms.service;

import com._42students.lms.dto.request.OrganizationDTO;
import com._42students.lms.model.Organization;

import java.util.List;
import java.util.Optional;

public interface OrganizationService {
    Organization createOrganisation(OrganizationDTO organizationDTO);
    List<Organization> findAll();
    Optional<Organization> findById(Integer id);
    Organization updateOrganization(Integer id, OrganizationDTO organizationDTO);
    void deleteOrganization(Integer id);
}

