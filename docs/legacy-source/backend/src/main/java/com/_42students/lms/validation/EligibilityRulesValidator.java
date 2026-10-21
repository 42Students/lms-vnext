package com._42students.lms.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class EligibilityRulesValidator implements ConstraintValidator<ValidEligibilityRules, Object> {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Set<String> VALID_KEYS = Set.of(
        "papRequired", "degree", "specialization", "graduationYear", "minGpa", "cityPreference",
        "customRules", "preferredDegree", "preferredSpecialization", "preferredGraduationYear",
        "preferredGpa", "preferredCity", "preferredSkills"
    );
    private static final int CUSTOM_RULES_MAX_ITEMS = 20;
    private static final int CUSTOM_RULE_LABEL_VALUE_MAX_LENGTH = 200;
    private static final int PREFERRED_SKILLS_MAX_ITEMS = 30;
    private static final int PREFERRED_SKILL_MAX_LENGTH = 50;

    private static final Set<String> VALID_PAP_VALUES = Set.of("YES", "NO", "yes", "no", "true", "false");

    @Override
    public void initialize(ValidEligibilityRules constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(Object eligibilityRules, ConstraintValidatorContext context) {
        if (eligibilityRules == null) {
            return true; // Allow null - eligibility rules are optional
        }

        try {
            // Convert to Map for validation
            @SuppressWarnings("unchecked")
            Map<String, Object> rules = objectMapper.convertValue(eligibilityRules, Map.class);

            // Validate each key and value
            for (Map.Entry<String, Object> entry : rules.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();

                // Check if key is valid
                if (!VALID_KEYS.contains(key)) {
                    context.disableDefaultConstraintViolation();
                    context.buildConstraintViolationWithTemplate(
                        "Invalid eligibility rule key: " + key + ". Valid keys are: " + VALID_KEYS)
                        .addConstraintViolation();
                    return false;
                }

                // Validate specific keys
                if ("papRequired".equals(key)) {
                    if (value == null) continue;
                    String papValue = String.valueOf(value).trim();
                    if (!VALID_PAP_VALUES.contains(papValue.toLowerCase())) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            "papRequired must be one of: YES, NO, true, false")
                            .addConstraintViolation();
                        return false;
                    }
                }

                if ("minGpa".equals(key) || "preferredGpa".equals(key)) {
                    if (value == null) continue;
                    try {
                        double gpa = Double.parseDouble(String.valueOf(value));
                        if (gpa < 0 || gpa > 10) {
                            context.disableDefaultConstraintViolation();
                            context.buildConstraintViolationWithTemplate(
                                key + " must be between 0 and 10")
                                .addConstraintViolation();
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            key + " must be a valid number")
                            .addConstraintViolation();
                        return false;
                    }
                }

                if ("graduationYear".equals(key) || "preferredGraduationYear".equals(key)) {
                    if (value == null) continue;
                    try {
                        int year = Integer.parseInt(String.valueOf(value));
                        int currentYear = java.time.Year.now().getValue();
                        if (year < currentYear - 10 || year > currentYear + 10) {
                            context.disableDefaultConstraintViolation();
                            context.buildConstraintViolationWithTemplate(
                                key + " must be within 10 years of current year")
                                .addConstraintViolation();
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            key + " must be a valid year")
                            .addConstraintViolation();
                        return false;
                    }
                }

                // Validate string fields have reasonable lengths
                if (value != null && (key.equals("degree") || key.equals("specialization") || key.equals("cityPreference")
                        || key.equals("preferredDegree") || key.equals("preferredSpecialization") || key.equals("preferredCity"))) {
                    String stringValue = String.valueOf(value).trim();
                    if (stringValue.length() > 100) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            key + " must not exceed 100 characters")
                            .addConstraintViolation();
                        return false;
                    }
                }

                // Validate preferredSkills: array of strings, capped length/count
                if ("preferredSkills".equals(key)) {
                    if (value == null) continue;
                    if (!(value instanceof List)) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            "preferredSkills must be an array of strings")
                            .addConstraintViolation();
                        return false;
                    }
                    List<?> skills = (List<?>) value;
                    if (skills.size() > PREFERRED_SKILLS_MAX_ITEMS) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            "preferredSkills must not exceed " + PREFERRED_SKILLS_MAX_ITEMS + " items")
                            .addConstraintViolation();
                        return false;
                    }
                    for (int i = 0; i < skills.size(); i++) {
                        Object skill = skills.get(i);
                        if (skill == null || !(skill instanceof String)) {
                            context.disableDefaultConstraintViolation();
                            context.buildConstraintViolationWithTemplate(
                                "preferredSkills[" + i + "] must be a string")
                                .addConstraintViolation();
                            return false;
                        }
                        String skillStr = ((String) skill).trim();
                        if (skillStr.isEmpty() || skillStr.length() > PREFERRED_SKILL_MAX_LENGTH) {
                            context.disableDefaultConstraintViolation();
                            context.buildConstraintViolationWithTemplate(
                                "preferredSkills[" + i + "] must be non-empty and not exceed " + PREFERRED_SKILL_MAX_LENGTH + " characters")
                                .addConstraintViolation();
                            return false;
                        }
                    }
                }

                // Validate customRules: array of { label, value } (both strings, max length, max items)
                if ("customRules".equals(key)) {
                    if (value == null) continue;
                    if (!(value instanceof List)) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            "customRules must be an array of objects with label and value")
                            .addConstraintViolation();
                        return false;
                    }
                    List<?> list = (List<?>) value;
                    if (list.size() > CUSTOM_RULES_MAX_ITEMS) {
                        context.disableDefaultConstraintViolation();
                        context.buildConstraintViolationWithTemplate(
                            "customRules must not exceed " + CUSTOM_RULES_MAX_ITEMS + " items")
                            .addConstraintViolation();
                        return false;
                    }
                    for (int i = 0; i < list.size(); i++) {
                        Object item = list.get(i);
                        if (!(item instanceof Map)) {
                            context.disableDefaultConstraintViolation();
                            context.buildConstraintViolationWithTemplate(
                                "customRules[" + i + "] must be an object with label and value")
                                .addConstraintViolation();
                            return false;
                        }
                        @SuppressWarnings("unchecked")
                        Map<String, Object> ruleEntry = (Map<String, Object>) item;
                        Object labelObj = ruleEntry.get("label");
                        Object valueObj = ruleEntry.get("value");
                        String labelStr = labelObj != null ? String.valueOf(labelObj).trim() : "";
                        String valueStr = valueObj != null ? String.valueOf(valueObj).trim() : "";
                        if (labelStr.length() > CUSTOM_RULE_LABEL_VALUE_MAX_LENGTH || valueStr.length() > CUSTOM_RULE_LABEL_VALUE_MAX_LENGTH) {
                            context.disableDefaultConstraintViolation();
                            context.buildConstraintViolationWithTemplate(
                                "customRules[" + i + "] label and value must not exceed " + CUSTOM_RULE_LABEL_VALUE_MAX_LENGTH + " characters")
                                .addConstraintViolation();
                            return false;
                        }
                    }
                }
            }

            return true;

        } catch (Exception e) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Eligibility rules must be valid JSON: " + e.getMessage())
                .addConstraintViolation();
            return false;
        }
    }
}


