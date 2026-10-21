package com._42students.lms.service;

import com._42students.lms.model.Company;
import com._42students.lms.model.Job;

import java.util.List;
import java.util.Map;

public interface CompanyService {

    /**
     * Lists companies for the given college/org, with each company carrying driveCount/lastActiveAt
     * (for sorting "who's an active partner vs. dormant for years") and, when includeDeleted is
     * true, also returning soft-deleted companies so an accidental delete can be found and restored.
     */
    List<Company> getAllCompaniesWithStats(Integer collegeId, boolean includeDeleted);

    Company getCompanyById(Integer companyId, Integer collegeId);

    Company createCompany(Company company, Integer collegeId);

    Company updateCompany(Integer companyId, Company company, Integer collegeId, boolean callerIsSuperAdmin);

    void deleteCompany(Integer companyId, Integer collegeId, boolean callerIsSuperAdmin);

    /** Undoes a soft delete — the only recovery path since the list view has no other way back. */
    Company restoreCompany(Integer companyId, Integer collegeId, boolean callerIsSuperAdmin);

    /** Every job (any status) linked to this company, or matching its name for legacy unlinked jobs, with application counts. */
    List<Job> getJobsForCompany(Integer companyId, Integer collegeId);

    /** Aggregate stats: total drives run, total applications, total hired, across this company's job history. */
    Map<String, Object> getCompanyStats(Integer companyId, Integer collegeId);
}
