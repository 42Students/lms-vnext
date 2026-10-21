package com._42students.lms.controller;

import com._42students.lms.common.CodingPlatforms;
import com._42students.lms.common.EducationConfig;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

/**
 * One place for the values every dropdown and filter offers (branch, gender, job type, education type, coding platform...), so a
 * form, a filter and a report never disagree. Lists are [{ value, label }]. Branches and passing years are the caller's college's
 * own (what its students actually have); everything else is the product's fixed list.
 */
@RestController
@RequestMapping("/api/v1/choices")
@RequiredArgsConstructor
public class ChoicesController {

    public static final List<String> GENDERS = List.of("Male", "Female", "Other", "Prefer not to say");
    static final Map<String, String> DRIVE_MODES = linked("ON_CAMPUS", "On campus", "POOL", "Pool", "OFF_CAMPUS", "Off campus");
    static final Map<String, String> REGISTRATION = linked("PLACEMENTS", "Placements", "HIGHER_STUDIES", "Higher studies", "NOT_INTERESTED", "Not interested");

    private final NamedParameterJdbcTemplate jdbc;
    private final SecurityContextUtil securityContextUtil;
    private final com._42students.lms.service.tpo.JobTypeService jobTypes;
    private final com._42students.lms.service.tpo.PlacementOutcomeService outcomes;

    @GetMapping
    public Map<String, Object> all() {
        Map<String, Object> out = new LinkedHashMap<>();
        Integer college = collegeOrNull();
        out.put("genders", same(GENDERS));
        // The college's job types as a new drive can pick them (Settings > Job types), each saying whether it counts as placed.
        List<Map<String, Object>> types = new ArrayList<>();
        for (var t : jobTypes.visible(college)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("value", t.name()); m.put("label", t.name()); m.put("countsAsPlaced", t.countsAsPlaced()); m.put("builtin", t.builtin());
            types.add(m);
        }
        out.put("jobTypes", types);
        // The fixed placement outcomes (NAAC 5.2 / NIRF) and the college's own labels, each under one of them.
        List<Map<String, Object>> fixed = new ArrayList<>();
        com._42students.lms.service.tpo.PlacementOutcomeService.OUTCOMES.forEach((k, v) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("value", k); m.put("label", v); m.put("settable", com._42students.lms.service.tpo.PlacementOutcomeService.CHOICE_OUTCOMES.contains(k));
            fixed.add(m);
        });
        out.put("outcomes", fixed);
        out.put("outcomeLabels", outcomes.labels(college));
        out.put("driveModes", options(DRIVE_MODES));
        out.put("registrationChoices", options(REGISTRATION));
        out.put("educationTypes", same(new ArrayList<>(EducationConfig.getEducationConfig().getEducationTypes().keySet())));
        out.put("gradingTypes", same(Arrays.asList(EducationConfig.getGradingTypes())));
        List<Map<String, Object>> platforms = new ArrayList<>();
        for (CodingPlatforms.Platform p : CodingPlatforms.ALL) {
            Map<String, Object> m = p.toMap();
            m.put("value", p.key()); m.put("label", p.label());
            platforms.add(m);
        }
        out.put("codingPlatforms", platforms);
        // Where a recruiter lead came from: the ones a person picks, then the two the system sets (pickable: false).
        List<Map<String, Object>> sources = new ArrayList<>();
        com._42students.lms.service.tpo.TpoRecruiterLeadService.SOURCES.forEach((k, v) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("value", k); m.put("label", v); m.put("pickable", com._42students.lms.service.tpo.TpoRecruiterLeadService.PICKABLE_SOURCES.contains(k));
            sources.add(m);
        });
        out.put("recruiterLeadSources", sources);
        out.put("branches", college == null ? List.of() : same(jdbc.queryForList(
                "SELECT DISTINCT TRIM(department) FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) " +
                "AND department IS NOT NULL AND TRIM(department) <> '' ORDER BY 1", new MapSqlParameterSource("c", college), String.class)));
        out.put("passingYears", college == null ? List.of() : same(jdbc.queryForList(
                "SELECT DISTINCT CAST(r.passing_year AS CHAR) FROM learner_academic_record r JOIN learner l ON l.id = r.learner_id " +
                "WHERE l.college_id = :c AND r.passing_year IS NOT NULL ORDER BY 1", new MapSqlParameterSource("c", college), String.class)));
        return out;
    }

    private Integer collegeOrNull() {
        try {
            UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
            return p == null ? null : p.getCollegeId();
        } catch (RuntimeException e) {
            return null; // a caller without a college (or a recruiter session) gets the fixed lists only
        }
    }

    private static Map<String, String> linked(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
        return Collections.unmodifiableMap(m);
    }

    private static List<Map<String, Object>> same(List<String> values) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (String v : values) out.add(Map.of("value", v, "label", v));
        return out;
    }

    private static List<Map<String, Object>> options(Map<String, String> m) {
        List<Map<String, Object>> out = new ArrayList<>();
        m.forEach((v, l) -> out.add(Map.of("value", v, "label", l)));
        return out;
    }
}
