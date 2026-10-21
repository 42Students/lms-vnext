package com._42students.lms.util;

import com._42students.lms.dto.profile.ExamConfig;
import com._42students.lms.dto.profile.ExamFieldConfig;
import java.util.*;

/**
 * Utility class to provide qualifying exam configurations
 * Centralized catalog of all qualifying exams with their field definitions
 */
public class QualifyingExamConfigUtil {
    
    private static final Map<String, ExamConfig> EXAM_CONFIGS = new LinkedHashMap<>();
    
    static {
        initializeExamConfigs();
    }
    
    public static List<ExamConfig> getAllExamConfigs() {
        return new ArrayList<>(EXAM_CONFIGS.values());
    }
    
    public static ExamConfig getExamConfig(String examCode) {
        return EXAM_CONFIGS.get(examCode);
    }
    
    public static List<ExamConfig> getExamsByLevel(String level) {
        List<ExamConfig> result = new ArrayList<>();
        for (ExamConfig config : EXAM_CONFIGS.values()) {
            if (level.equalsIgnoreCase(config.getLevel())) {
                result.add(config);
            }
        }
        return result;
    }
    
    private static void initializeExamConfigs() {
        // ============ UG (Undergraduate) Exams ============
        
        // JEE Main
        ExamConfig jeeMain = new ExamConfig();
        jeeMain.setExamCode("JEE_MAIN");
        jeeMain.setExamName("JEE Main");
        jeeMain.setLevel("UG");
        jeeMain.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("ntaScore", "NTA Score", true, null, null, "e.g., 285"),
            createNumberField("percentile", "Percentile", true, 0.0, 100.0, "e.g., 95.5"),
            createNumberField("air", "All India Rank (AIR)", false, null, null, "e.g., 1500"),
            createNumberField("categoryRank", "Category Rank", false, null, null, null)
        ));
        EXAM_CONFIGS.put("JEE_MAIN", jeeMain);
        
        // JEE Advanced
        ExamConfig jeeAdvanced = new ExamConfig();
        jeeAdvanced.setExamCode("JEE_ADVANCED");
        jeeAdvanced.setExamName("JEE Advanced");
        jeeAdvanced.setLevel("UG");
        jeeAdvanced.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("air", "All India Rank (AIR)", true, null, null, "e.g., 1500"),
            createNumberField("categoryRank", "Category Rank", false, null, null, null),
            createNumberField("marks", "Marks Obtained", false, null, null, null)
        ));
        EXAM_CONFIGS.put("JEE_ADVANCED", jeeAdvanced);
        
        // KCET
        ExamConfig kcet = new ExamConfig();
        kcet.setExamCode("KCET");
        kcet.setExamName("KCET");
        kcet.setLevel("UG");
        kcet.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("rank", "Rank", true, null, null, "e.g., 5000"),
            createNumberField("score", "Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("KCET", kcet);
        
        // EAMCET
        ExamConfig eamcet = new ExamConfig();
        eamcet.setExamCode("EAMCET");
        eamcet.setExamName("EAMCET");
        eamcet.setLevel("UG");
        eamcet.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("rank", "Rank", true, null, null, "e.g., 5000"),
            createNumberField("score", "Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("EAMCET", eamcet);
        
        // TS EAMCET
        ExamConfig tsEamcet = new ExamConfig();
        tsEamcet.setExamCode("TS_EAMCET");
        tsEamcet.setExamName("TS EAMCET");
        tsEamcet.setLevel("UG");
        tsEamcet.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("rank", "Rank", true, null, null, "e.g., 5000"),
            createNumberField("score", "Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("TS_EAMCET", tsEamcet);
        
        // MHT CET
        ExamConfig mhtCet = new ExamConfig();
        mhtCet.setExamCode("MHT_CET");
        mhtCet.setExamName("MHT CET");
        mhtCet.setLevel("UG");
        mhtCet.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("percentile", "Percentile", true, 0.0, 100.0, "e.g., 95.5"),
            createNumberField("rank", "Rank", false, null, null, null),
            createNumberField("score", "Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("MHT_CET", mhtCet);
        
        // WBJEE
        ExamConfig wbjee = new ExamConfig();
        wbjee.setExamCode("WBJEE");
        wbjee.setExamName("WBJEE");
        wbjee.setLevel("UG");
        wbjee.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("rank", "Rank", true, null, null, "e.g., 5000"),
            createNumberField("score", "Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("WBJEE", wbjee);
        
        // BITSAT
        ExamConfig bitsat = new ExamConfig();
        bitsat.setExamCode("BITSAT");
        bitsat.setExamName("BITSAT");
        bitsat.setLevel("UG");
        bitsat.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("score", "Score", true, null, null, "e.g., 350"),
            createNumberField("rank", "Rank", false, null, null, null)
        ));
        EXAM_CONFIGS.put("BITSAT", bitsat);
        
        // COMEDK UGET
        ExamConfig comedk = new ExamConfig();
        comedk.setExamCode("COMEDK_UGET");
        comedk.setExamName("COMEDK UGET");
        comedk.setLevel("UG");
        comedk.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("rank", "Rank", true, null, null, "e.g., 5000"),
            createNumberField("score", "Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("COMEDK_UGET", comedk);
        
        // VITEEE
        ExamConfig viteee = new ExamConfig();
        viteee.setExamCode("VITEEE");
        viteee.setExamName("VITEEE");
        viteee.setLevel("UG");
        viteee.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("score", "Score", true, null, null, null),
            createNumberField("rank", "Rank", false, null, null, null)
        ));
        EXAM_CONFIGS.put("VITEEE", viteee);
        
        // SRMJEE
        ExamConfig srmjee = new ExamConfig();
        srmjee.setExamCode("SRMJEE");
        srmjee.setExamName("SRMJEE");
        srmjee.setLevel("UG");
        srmjee.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("score", "Score", true, null, null, null),
            createNumberField("rank", "Rank", false, null, null, null)
        ));
        EXAM_CONFIGS.put("SRMJEE", srmjee);
        
        // TNEA
        ExamConfig tnea = new ExamConfig();
        tnea.setExamCode("TNEA");
        tnea.setExamName("TNEA");
        tnea.setLevel("UG");
        tnea.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("cutoff", "Cut-off Marks", true, null, null, null)
        ));
        EXAM_CONFIGS.put("TNEA", tnea);
        
        // ============ PG (Postgraduate) Exams ============
        
        // GATE
        ExamConfig gate = new ExamConfig();
        gate.setExamCode("GATE");
        gate.setExamName("GATE");
        gate.setLevel("PG");
        gate.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("gateScore", "GATE Score", true, null, null, "e.g., 850"),
            createNumberField("air", "All India Rank (AIR)", false, null, null, "e.g., 500"),
            createNumberField("marks", "Marks Obtained", false, null, null, null),
            createTextField("paperCode", "Paper Code", false, "e.g., CS, ME, EE")
        ));
        EXAM_CONFIGS.put("GATE", gate);
        
        // CAT
        ExamConfig cat = new ExamConfig();
        cat.setExamCode("CAT");
        cat.setExamName("CAT");
        cat.setLevel("PG");
        cat.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("percentile", "Overall Percentile", true, 0.0, 100.0, "e.g., 95.5"),
            createNumberField("score", "Overall Score", false, null, null, null),
            createNumberField("verbalPercentile", "Verbal Percentile", false, 0.0, 100.0, null),
            createNumberField("dilrPercentile", "DILR Percentile", false, 0.0, 100.0, null),
            createNumberField("quantPercentile", "Quant Percentile", false, 0.0, 100.0, null)
        ));
        EXAM_CONFIGS.put("CAT", cat);
        
        // XAT
        ExamConfig xat = new ExamConfig();
        xat.setExamCode("XAT");
        xat.setExamName("XAT");
        xat.setLevel("PG");
        xat.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("percentile", "Percentile", true, 0.0, 100.0, "e.g., 95.5"),
            createNumberField("score", "Overall Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("XAT", xat);
        
        // MAT
        ExamConfig mat = new ExamConfig();
        mat.setExamCode("MAT");
        mat.setExamName("MAT");
        mat.setLevel("PG");
        mat.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("score", "Score", true, null, null, null),
            createNumberField("percentile", "Percentile", false, 0.0, 100.0, null)
        ));
        EXAM_CONFIGS.put("MAT", mat);
        
        // CMAT
        ExamConfig cmat = new ExamConfig();
        cmat.setExamCode("CMAT");
        cmat.setExamName("CMAT");
        cmat.setLevel("PG");
        cmat.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("score", "Score", true, null, null, null),
            createNumberField("percentile", "Percentile", false, 0.0, 100.0, null)
        ));
        EXAM_CONFIGS.put("CMAT", cmat);
        
        // PGCET
        ExamConfig pgcet = new ExamConfig();
        pgcet.setExamCode("PGCET");
        pgcet.setExamName("PGCET");
        pgcet.setLevel("PG");
        pgcet.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("rank", "Rank", true, null, null, "e.g., 500"),
            createNumberField("score", "Score", false, null, null, null)
        ));
        EXAM_CONFIGS.put("PGCET", pgcet);
        
        // TANCET
        ExamConfig tancet = new ExamConfig();
        tancet.setExamCode("TANCET");
        tancet.setExamName("TANCET");
        tancet.setLevel("PG");
        tancet.setFields(Arrays.asList(
            createNumberField("year", "Year", true, 2000.0, 2030.0, null),
            createNumberField("score", "Score", true, null, null, null),
            createNumberField("rank", "Rank", false, null, null, null)
        ));
        EXAM_CONFIGS.put("TANCET", tancet);
    }
    
    private static ExamFieldConfig createNumberField(String name, String label, boolean required, 
                                                     Double min, Double max, String placeholder) {
        ExamFieldConfig field = new ExamFieldConfig();
        field.setName(name);
        field.setLabel(label);
        field.setType("number");
        field.setRequired(required);
        field.setMin(min);
        field.setMax(max);
        field.setPlaceholder(placeholder);
        return field;
    }
    
    private static ExamFieldConfig createTextField(String name, String label, boolean required, String placeholder) {
        ExamFieldConfig field = new ExamFieldConfig();
        field.setName(name);
        field.setLabel(label);
        field.setType("text");
        field.setRequired(required);
        field.setPlaceholder(placeholder);
        return field;
    }
}


