package com._42students.lms.common;

import com._42students.lms.dto.profile.EducationConfigDTO;
import java.util.*;

/**
 * Configuration for Education Types, Programs, and Specializations
 * Comprehensive list covering all major education programs
 */
public class EducationConfig {
    
    public static EducationConfigDTO getEducationConfig() {
        EducationConfigDTO config = new EducationConfigDTO();
        Map<String, EducationConfigDTO.EducationTypeConfig> educationTypes = new LinkedHashMap<>();
        
        // 10th Standard
        EducationConfigDTO.EducationTypeConfig tenth = new EducationConfigDTO.EducationTypeConfig();
        tenth.setLabel("10th Standard (SSC)");
        Map<String, EducationConfigDTO.ProgramConfig> tenthPrograms = new LinkedHashMap<>();
        EducationConfigDTO.ProgramConfig ssc = new EducationConfigDTO.ProgramConfig();
        ssc.setLabel("SSC (Secondary School Certificate)");
        ssc.setSpecializations(new String[]{});
        tenthPrograms.put("SSC", ssc);
        EducationConfigDTO.ProgramConfig cbse = new EducationConfigDTO.ProgramConfig();
        cbse.setLabel("CBSE (Central Board of Secondary Education)");
        cbse.setSpecializations(new String[]{});
        tenthPrograms.put("CBSE", cbse);
        EducationConfigDTO.ProgramConfig icse = new EducationConfigDTO.ProgramConfig();
        icse.setLabel("ICSE (Indian Certificate of Secondary Education)");
        icse.setSpecializations(new String[]{});
        tenthPrograms.put("ICSE", icse);
        EducationConfigDTO.ProgramConfig tenthOther = new EducationConfigDTO.ProgramConfig();
        tenthOther.setLabel("Other Board");
        tenthOther.setSpecializations(new String[]{"Other"});
        tenthPrograms.put("10TH_OTHER", tenthOther);
        tenth.setPrograms(tenthPrograms);
        educationTypes.put("10th", tenth);
        
        // 12th Standard / Intermediate
        EducationConfigDTO.EducationTypeConfig twelfth = new EducationConfigDTO.EducationTypeConfig();
        twelfth.setLabel("12th Standard (HSC) / Intermediate");
        Map<String, EducationConfigDTO.ProgramConfig> twelfthPrograms = new LinkedHashMap<>();
        
        EducationConfigDTO.ProgramConfig hscScience = new EducationConfigDTO.ProgramConfig();
        hscScience.setLabel("HSC Science");
        hscScience.setSpecializations(new String[]{
            "Physics, Chemistry, Mathematics (PCM)",
            "Physics, Chemistry, Biology (PCB)",
            "Physics, Chemistry, Mathematics, Biology (PCMB)",
            "Physics, Chemistry, Mathematics, Computer Science",
            "Physics, Chemistry, Biology, Mathematics"
        });
        twelfthPrograms.put("HSC_SCIENCE", hscScience);
        
        EducationConfigDTO.ProgramConfig hscCommerce = new EducationConfigDTO.ProgramConfig();
        hscCommerce.setLabel("HSC Commerce");
        hscCommerce.setSpecializations(new String[]{
            "Accountancy",
            "Business Studies",
            "Economics",
            "Mathematics",
            "Statistics",
            "Computer Science",
            "Accountancy, Business Studies, Economics"
        });
        twelfthPrograms.put("HSC_COMMERCE", hscCommerce);
        
        EducationConfigDTO.ProgramConfig hscArts = new EducationConfigDTO.ProgramConfig();
        hscArts.setLabel("HSC Arts");
        hscArts.setSpecializations(new String[]{
            "History",
            "Political Science",
            "Economics",
            "Geography",
            "Literature",
            "Psychology",
            "Sociology",
            "Philosophy",
            "Fine Arts",
            "Music"
        });
        twelfthPrograms.put("HSC_ARTS", hscArts);
        
        EducationConfigDTO.ProgramConfig cbse12 = new EducationConfigDTO.ProgramConfig();
        cbse12.setLabel("CBSE 12th");
        cbse12.setSpecializations(new String[]{"Science", "Commerce", "Arts", "Other"});
        twelfthPrograms.put("CBSE_12", cbse12);
        
        EducationConfigDTO.ProgramConfig twelfthOther = new EducationConfigDTO.ProgramConfig();
        twelfthOther.setLabel("Other 12th Board");
        twelfthOther.setSpecializations(new String[]{"Other"});
        twelfthPrograms.put("12TH_OTHER", twelfthOther);
        
        twelfth.setPrograms(twelfthPrograms);
        educationTypes.put("12th", twelfth);
        
        // Diploma
        EducationConfigDTO.EducationTypeConfig diploma = new EducationConfigDTO.EducationTypeConfig();
        diploma.setLabel("Diploma");
        Map<String, EducationConfigDTO.ProgramConfig> diplomaPrograms = new LinkedHashMap<>();
        
        EducationConfigDTO.ProgramConfig diplomaEngg = new EducationConfigDTO.ProgramConfig();
        diplomaEngg.setLabel("Diploma in Engineering");
        diplomaEngg.setSpecializations(new String[]{
            "Computer Science & Engineering",
            "Electronics & Communication Engineering",
            "Electrical & Electronics Engineering",
            "Mechanical Engineering",
            "Civil Engineering",
            "Automobile Engineering",
            "Information Technology",
            "Chemical Engineering",
            "Aerospace Engineering",
            "Biotechnology",
            "Instrumentation Engineering",
            "Production Engineering",
            "Textile Engineering",
            "Marine Engineering",
            "Mining Engineering",
            "Petroleum Engineering",
            "Other"
        });
        diplomaPrograms.put("DIPLOMA_ENG", diplomaEngg);
        
        EducationConfigDTO.ProgramConfig diplomaBusiness = new EducationConfigDTO.ProgramConfig();
        diplomaBusiness.setLabel("Diploma in Business");
        diplomaBusiness.setSpecializations(new String[]{
            "Business Administration",
            "Hotel Management",
            "Hospitality Management",
            "Travel & Tourism",
            "Event Management",
            "Retail Management",
            "Supply Chain Management",
            "Other"
        });
        diplomaPrograms.put("DIPLOMA_BUSINESS", diplomaBusiness);
        
        EducationConfigDTO.ProgramConfig diplomaMedical = new EducationConfigDTO.ProgramConfig();
        diplomaMedical.setLabel("Diploma in Medical/Healthcare");
        diplomaMedical.setSpecializations(new String[]{
            "Nursing",
            "Pharmacy",
            "Medical Laboratory Technology",
            "Radiography",
            "Physiotherapy",
            "Dental Hygiene",
            "Optometry",
            "Other"
        });
        diplomaPrograms.put("DIPLOMA_MEDICAL", diplomaMedical);
        
        EducationConfigDTO.ProgramConfig diplomaArts = new EducationConfigDTO.ProgramConfig();
        diplomaArts.setLabel("Diploma in Arts/Design");
        diplomaArts.setSpecializations(new String[]{
            "Fine Arts",
            "Graphic Design",
            "Interior Design",
            "Fashion Design",
            "Animation",
            "Multimedia",
            "Photography",
            "Other"
        });
        diplomaPrograms.put("DIPLOMA_ARTS", diplomaArts);
        
        EducationConfigDTO.ProgramConfig diplomaOther = new EducationConfigDTO.ProgramConfig();
        diplomaOther.setLabel("Other Diploma");
        diplomaOther.setSpecializations(new String[]{"Other"});
        diplomaPrograms.put("DIPLOMA_OTHER", diplomaOther);
        
        diploma.setPrograms(diplomaPrograms);
        educationTypes.put("Diploma", diploma);
        
        // Undergraduate (UG)
        EducationConfigDTO.EducationTypeConfig ug = new EducationConfigDTO.EducationTypeConfig();
        ug.setLabel("Undergraduate (UG)");
        Map<String, EducationConfigDTO.ProgramConfig> ugPrograms = new LinkedHashMap<>();
        
        // Engineering Programs
        EducationConfigDTO.ProgramConfig btech = new EducationConfigDTO.ProgramConfig();
        btech.setLabel("B.Tech (Bachelor of Technology)");
        btech.setSpecializations(new String[]{
            "Computer Science & Engineering (CSE)",
            "Electronics & Communication Engineering (ECE)",
            "Electrical & Electronics Engineering (EEE)",
            "Mechanical Engineering",
            "Civil Engineering",
            "Information Technology (IT)",
            "Aerospace Engineering",
            "Chemical Engineering",
            "Biotechnology",
            "Automobile Engineering",
            "Instrumentation Engineering",
            "Industrial Engineering",
            "Production Engineering",
            "Textile Engineering",
            "Marine Engineering",
            "Mining Engineering",
            "Petroleum Engineering",
            "Environmental Engineering",
            "Food Technology",
            "Agricultural Engineering",
            "Metallurgical Engineering",
            "Ceramic Engineering",
            "Other"
        });
        ugPrograms.put("BTECH", btech);
        
        EducationConfigDTO.ProgramConfig be = new EducationConfigDTO.ProgramConfig();
        be.setLabel("B.E. (Bachelor of Engineering)");
        be.setSpecializations(new String[]{
            "Computer Science & Engineering (CSE)",
            "Electronics & Communication Engineering (ECE)",
            "Electrical & Electronics Engineering (EEE)",
            "Mechanical Engineering",
            "Civil Engineering",
            "Information Technology (IT)",
            "Aerospace Engineering",
            "Chemical Engineering",
            "Biotechnology",
            "Automobile Engineering",
            "Other"
        });
        ugPrograms.put("BE", be);
        
        EducationConfigDTO.ProgramConfig barch = new EducationConfigDTO.ProgramConfig();
        barch.setLabel("B.Arch (Bachelor of Architecture)");
        barch.setSpecializations(new String[]{
            "General Architecture",
            "Landscape Architecture",
            "Interior Architecture",
            "Urban Planning",
            "Other"
        });
        ugPrograms.put("BARCH", barch);
        
        // Science Programs
        EducationConfigDTO.ProgramConfig bsc = new EducationConfigDTO.ProgramConfig();
        bsc.setLabel("B.Sc (Bachelor of Science)");
        bsc.setSpecializations(new String[]{
            "Mathematics",
            "Physics",
            "Chemistry",
            "Biology",
            "Computer Science",
            "Electronics",
            "Statistics",
            "Biotechnology",
            "Microbiology",
            "Biochemistry",
            "Zoology",
            "Botany",
            "Environmental Science",
            "Forensic Science",
            "Food Science",
            "Agriculture",
            "Horticulture",
            "Fisheries Science",
            "Nursing",
            "Psychology",
            "Home Science",
            "Other"
        });
        ugPrograms.put("BSC", bsc);
        
        // Commerce Programs
        EducationConfigDTO.ProgramConfig bcom = new EducationConfigDTO.ProgramConfig();
        bcom.setLabel("B.Com (Bachelor of Commerce)");
        bcom.setSpecializations(new String[]{
            "General",
            "Accounting & Finance",
            "Banking & Insurance",
            "Computer Applications",
            "Taxation",
            "E-Commerce",
            "Financial Markets",
            "Investment Management",
            "Other"
        });
        ugPrograms.put("BCOM", bcom);
        
        // Arts Programs
        EducationConfigDTO.ProgramConfig ba = new EducationConfigDTO.ProgramConfig();
        ba.setLabel("B.A. (Bachelor of Arts)");
        ba.setSpecializations(new String[]{
            "English",
            "History",
            "Political Science",
            "Economics",
            "Psychology",
            "Sociology",
            "Geography",
            "Philosophy",
            "Literature",
            "Journalism & Mass Communication",
            "Fine Arts",
            "Music",
            "Dance",
            "Theatre",
            "Languages",
            "Public Administration",
            "Social Work",
            "Other"
        });
        ugPrograms.put("BA", ba);
        
        // Business Programs
        EducationConfigDTO.ProgramConfig bba = new EducationConfigDTO.ProgramConfig();
        bba.setLabel("BBA (Bachelor of Business Administration)");
        bba.setSpecializations(new String[]{
            "General",
            "Finance",
            "Marketing",
            "Human Resources",
            "International Business",
            "Information Technology",
            "Entrepreneurship",
            "Supply Chain Management",
            "Hospitality Management",
            "Tourism Management",
            "Retail Management",
            "Other"
        });
        ugPrograms.put("BBA", bba);
        
        EducationConfigDTO.ProgramConfig bms = new EducationConfigDTO.ProgramConfig();
        bms.setLabel("BMS (Bachelor of Management Studies)");
        bms.setSpecializations(new String[]{
            "General",
            "Finance",
            "Marketing",
            "Human Resources",
            "Other"
        });
        ugPrograms.put("BMS", bms);
        
        // Computer Applications
        EducationConfigDTO.ProgramConfig bca = new EducationConfigDTO.ProgramConfig();
        bca.setLabel("BCA (Bachelor of Computer Applications)");
        bca.setSpecializations(new String[]{
            "General",
            "Data Science",
            "Cloud Computing",
            "Cyber Security",
            "Mobile Applications",
            "Web Development",
            "Other"
        });
        ugPrograms.put("BCA", bca);
        
        // Medical Programs
        EducationConfigDTO.ProgramConfig mbbs = new EducationConfigDTO.ProgramConfig();
        mbbs.setLabel("MBBS (Bachelor of Medicine, Bachelor of Surgery)");
        mbbs.setSpecializations(new String[]{});
        ugPrograms.put("MBBS", mbbs);
        
        EducationConfigDTO.ProgramConfig bpharm = new EducationConfigDTO.ProgramConfig();
        bpharm.setLabel("B.Pharm (Bachelor of Pharmacy)");
        bpharm.setSpecializations(new String[]{
            "General",
            "Pharmaceutical Chemistry",
            "Pharmacology",
            "Pharmaceutics",
            "Other"
        });
        ugPrograms.put("BPHARM", bpharm);
        
        EducationConfigDTO.ProgramConfig bds = new EducationConfigDTO.ProgramConfig();
        bds.setLabel("BDS (Bachelor of Dental Surgery)");
        bds.setSpecializations(new String[]{});
        ugPrograms.put("BDS", bds);
        
        EducationConfigDTO.ProgramConfig bams = new EducationConfigDTO.ProgramConfig();
        bams.setLabel("BAMS (Bachelor of Ayurvedic Medicine and Surgery)");
        bams.setSpecializations(new String[]{});
        ugPrograms.put("BAMS", bams);
        
        EducationConfigDTO.ProgramConfig bhms = new EducationConfigDTO.ProgramConfig();
        bhms.setLabel("BHMS (Bachelor of Homeopathic Medicine and Surgery)");
        bhms.setSpecializations(new String[]{});
        ugPrograms.put("BHMS", bhms);
        
        EducationConfigDTO.ProgramConfig bpt = new EducationConfigDTO.ProgramConfig();
        bpt.setLabel("BPT (Bachelor of Physiotherapy)");
        bpt.setSpecializations(new String[]{
            "General",
            "Sports Physiotherapy",
            "Neurological Physiotherapy",
            "Cardiopulmonary Physiotherapy",
            "Other"
        });
        ugPrograms.put("BPT", bpt);
        
        EducationConfigDTO.ProgramConfig boptom = new EducationConfigDTO.ProgramConfig();
        boptom.setLabel("B.Optom (Bachelor of Optometry)");
        boptom.setSpecializations(new String[]{});
        ugPrograms.put("BOPTOM", boptom);
        
        EducationConfigDTO.ProgramConfig bvsc = new EducationConfigDTO.ProgramConfig();
        bvsc.setLabel("BVSc (Bachelor of Veterinary Science)");
        bvsc.setSpecializations(new String[]{});
        ugPrograms.put("BVSC", bvsc);
        
        // Law Programs
        EducationConfigDTO.ProgramConfig llb = new EducationConfigDTO.ProgramConfig();
        llb.setLabel("LLB (Bachelor of Laws)");
        llb.setSpecializations(new String[]{
            "General",
            "Corporate Law",
            "Criminal Law",
            "Constitutional Law",
            "International Law",
            "Tax Law",
            "Intellectual Property Law",
            "Other"
        });
        ugPrograms.put("LLB", llb);
        
        // Design Programs
        EducationConfigDTO.ProgramConfig bdes = new EducationConfigDTO.ProgramConfig();
        bdes.setLabel("B.Des (Bachelor of Design)");
        bdes.setSpecializations(new String[]{
            "Fashion Design",
            "Interior Design",
            "Graphic Design",
            "Product Design",
            "Industrial Design",
            "Textile Design",
            "Jewelry Design",
            "Animation Design",
            "Other"
        });
        ugPrograms.put("BDES", bdes);
        
        EducationConfigDTO.ProgramConfig bfa = new EducationConfigDTO.ProgramConfig();
        bfa.setLabel("BFA (Bachelor of Fine Arts)");
        bfa.setSpecializations(new String[]{
            "Painting",
            "Sculpture",
            "Applied Arts",
            "Visual Arts",
            "Digital Arts",
            "Other"
        });
        ugPrograms.put("BFA", bfa);
        
        // Education Programs
        EducationConfigDTO.ProgramConfig bed = new EducationConfigDTO.ProgramConfig();
        bed.setLabel("B.Ed (Bachelor of Education)");
        bed.setSpecializations(new String[]{
            "General",
            "Elementary Education",
            "Special Education",
            "Physical Education",
            "Other"
        });
        ugPrograms.put("BED", bed);
        
        // Media Programs
        EducationConfigDTO.ProgramConfig bmm = new EducationConfigDTO.ProgramConfig();
        bmm.setLabel("BMM (Bachelor of Mass Media)");
        bmm.setSpecializations(new String[]{
            "Journalism",
            "Advertising",
            "Public Relations",
            "Film & Television",
            "Radio",
            "Digital Media",
            "Other"
        });
        ugPrograms.put("BMM", bmm);
        
        EducationConfigDTO.ProgramConfig bjmc = new EducationConfigDTO.ProgramConfig();
        bjmc.setLabel("BJMC (Bachelor of Journalism and Mass Communication)");
        bjmc.setSpecializations(new String[]{
            "Print Journalism",
            "Electronic Journalism",
            "Digital Journalism",
            "Advertising",
            "Public Relations",
            "Other"
        });
        ugPrograms.put("BJMC", bjmc);
        
        // Hotel Management
        EducationConfigDTO.ProgramConfig bhm = new EducationConfigDTO.ProgramConfig();
        bhm.setLabel("BHM (Bachelor of Hotel Management)");
        bhm.setSpecializations(new String[]{
            "General",
            "Culinary Arts",
            "Hospitality Management",
            "Event Management",
            "Travel & Tourism",
            "Other"
        });
        ugPrograms.put("BHM", bhm);
        
        // Social Work
        EducationConfigDTO.ProgramConfig bsw = new EducationConfigDTO.ProgramConfig();
        bsw.setLabel("BSW (Bachelor of Social Work)");
        bsw.setSpecializations(new String[]{
            "General",
            "Community Development",
            "Child Welfare",
            "Women's Studies",
            "Other"
        });
        ugPrograms.put("BSW", bsw);
        
        // Other UG Programs
        EducationConfigDTO.ProgramConfig ugOther = new EducationConfigDTO.ProgramConfig();
        ugOther.setLabel("Other UG Degree");
        ugOther.setSpecializations(new String[]{"Other"});
        ugPrograms.put("UG_OTHER", ugOther);
        
        ug.setPrograms(ugPrograms);
        educationTypes.put("UG", ug);
        
        // Postgraduate (PG)
        EducationConfigDTO.EducationTypeConfig pg = new EducationConfigDTO.EducationTypeConfig();
        pg.setLabel("Postgraduate (PG)");
        Map<String, EducationConfigDTO.ProgramConfig> pgPrograms = new LinkedHashMap<>();
        
        // Engineering Programs
        EducationConfigDTO.ProgramConfig mtech = new EducationConfigDTO.ProgramConfig();
        mtech.setLabel("M.Tech (Master of Technology)");
        mtech.setSpecializations(new String[]{
            "Computer Science & Engineering (CSE)",
            "Electronics & Communication Engineering (ECE)",
            "Electrical & Electronics Engineering (EEE)",
            "Mechanical Engineering",
            "Civil Engineering",
            "Information Technology (IT)",
            "Aerospace Engineering",
            "Chemical Engineering",
            "Biotechnology",
            "Data Science",
            "Artificial Intelligence",
            "Machine Learning",
            "Deep Learning",
            "Cyber Security",
            "Cloud Computing",
            "Internet of Things (IoT)",
            "Robotics",
            "Automobile Engineering",
            "Environmental Engineering",
            "Structural Engineering",
            "VLSI Design",
            "Power Systems",
            "Control Systems",
            "Other"
        });
        pgPrograms.put("MTECH", mtech);
        
        EducationConfigDTO.ProgramConfig me = new EducationConfigDTO.ProgramConfig();
        me.setLabel("M.E. (Master of Engineering)");
        me.setSpecializations(new String[]{
            "Computer Science & Engineering (CSE)",
            "Electronics & Communication Engineering (ECE)",
            "Electrical & Electronics Engineering (EEE)",
            "Mechanical Engineering",
            "Civil Engineering",
            "Information Technology (IT)",
            "Other"
        });
        pgPrograms.put("ME", me);
        
        EducationConfigDTO.ProgramConfig march = new EducationConfigDTO.ProgramConfig();
        march.setLabel("M.Arch (Master of Architecture)");
        march.setSpecializations(new String[]{
            "General Architecture",
            "Landscape Architecture",
            "Interior Architecture",
            "Urban Planning",
            "Sustainable Architecture",
            "Other"
        });
        pgPrograms.put("MARCH", march);
        
        // Business Programs
        EducationConfigDTO.ProgramConfig mba = new EducationConfigDTO.ProgramConfig();
        mba.setLabel("MBA (Master of Business Administration)");
        mba.setSpecializations(new String[]{
            "General",
            "Finance",
            "Marketing",
            "Human Resources",
            "Operations",
            "Information Technology",
            "International Business",
            "Entrepreneurship",
            "Supply Chain Management",
            "Healthcare Management",
            "Hospitality Management",
            "Retail Management",
            "Banking & Finance",
            "Business Analytics",
            "Digital Marketing",
            "Project Management",
            "Other"
        });
        pgPrograms.put("MBA", mba);
        
        EducationConfigDTO.ProgramConfig pgdba = new EducationConfigDTO.ProgramConfig();
        pgdba.setLabel("PGDBA (Post Graduate Diploma in Business Administration)");
        pgdba.setSpecializations(new String[]{
            "General",
            "Finance",
            "Marketing",
            "Human Resources",
            "Operations",
            "Other"
        });
        pgPrograms.put("PGDBA", pgdba);
        
        // Science Programs
        EducationConfigDTO.ProgramConfig msc = new EducationConfigDTO.ProgramConfig();
        msc.setLabel("M.Sc (Master of Science)");
        msc.setSpecializations(new String[]{
            "Mathematics",
            "Physics",
            "Chemistry",
            "Biology",
            "Computer Science",
            "Electronics",
            "Statistics",
            "Biotechnology",
            "Microbiology",
            "Biochemistry",
            "Zoology",
            "Botany",
            "Environmental Science",
            "Forensic Science",
            "Food Science",
            "Data Science",
            "Artificial Intelligence",
            "Cyber Security",
            "Psychology",
            "Other"
        });
        pgPrograms.put("MSC", msc);
        
        // Commerce Programs
        EducationConfigDTO.ProgramConfig mcom = new EducationConfigDTO.ProgramConfig();
        mcom.setLabel("M.Com (Master of Commerce)");
        mcom.setSpecializations(new String[]{
            "General",
            "Accounting & Finance",
            "Banking & Insurance",
            "Taxation",
            "E-Commerce",
            "Financial Markets",
            "Other"
        });
        pgPrograms.put("MCOM", mcom);
        
        // Arts Programs
        EducationConfigDTO.ProgramConfig ma = new EducationConfigDTO.ProgramConfig();
        ma.setLabel("M.A. (Master of Arts)");
        ma.setSpecializations(new String[]{
            "English",
            "History",
            "Political Science",
            "Economics",
            "Psychology",
            "Sociology",
            "Geography",
            "Philosophy",
            "Literature",
            "Journalism & Mass Communication",
            "Fine Arts",
            "Music",
            "Public Administration",
            "Social Work",
            "Languages",
            "Other"
        });
        pgPrograms.put("MA", ma);
        
        // Computer Applications
        EducationConfigDTO.ProgramConfig mca = new EducationConfigDTO.ProgramConfig();
        mca.setLabel("MCA (Master of Computer Applications)");
        mca.setSpecializations(new String[]{
            "General",
            "Data Science",
            "Cloud Computing",
            "Cyber Security",
            "Mobile Applications",
            "Web Development",
            "Artificial Intelligence",
            "Machine Learning",
            "Other"
        });
        pgPrograms.put("MCA", mca);
        
        // Medical Programs
        EducationConfigDTO.ProgramConfig md = new EducationConfigDTO.ProgramConfig();
        md.setLabel("MD (Doctor of Medicine)");
        md.setSpecializations(new String[]{
            "General Medicine",
            "Pediatrics",
            "Cardiology",
            "Neurology",
            "Psychiatry",
            "Dermatology",
            "Orthopedics",
            "Ophthalmology",
            "ENT",
            "Gynecology",
            "Anesthesiology",
            "Radiology",
            "Pathology",
            "Other"
        });
        pgPrograms.put("MD", md);
        
        EducationConfigDTO.ProgramConfig ms = new EducationConfigDTO.ProgramConfig();
        ms.setLabel("M.S. (Master of Surgery)");
        ms.setSpecializations(new String[]{
            "General Surgery",
            "Orthopedics",
            "Neurosurgery",
            "Cardiac Surgery",
            "Plastic Surgery",
            "Urology",
            "Other"
        });
        pgPrograms.put("MS", ms);
        
        EducationConfigDTO.ProgramConfig mpharm = new EducationConfigDTO.ProgramConfig();
        mpharm.setLabel("M.Pharm (Master of Pharmacy)");
        mpharm.setSpecializations(new String[]{
            "Pharmaceutics",
            "Pharmacology",
            "Pharmaceutical Chemistry",
            "Pharmacognosy",
            "Pharmaceutical Analysis",
            "Pharmacy Practice",
            "Other"
        });
        pgPrograms.put("MPHARM", mpharm);
        
        EducationConfigDTO.ProgramConfig mpt = new EducationConfigDTO.ProgramConfig();
        mpt.setLabel("MPT (Master of Physiotherapy)");
        mpt.setSpecializations(new String[]{
            "Sports Physiotherapy",
            "Neurological Physiotherapy",
            "Cardiopulmonary Physiotherapy",
            "Orthopedic Physiotherapy",
            "Pediatric Physiotherapy",
            "Other"
        });
        pgPrograms.put("MPT", mpt);
        
        // Law Programs
        EducationConfigDTO.ProgramConfig llm = new EducationConfigDTO.ProgramConfig();
        llm.setLabel("LLM (Master of Laws)");
        llm.setSpecializations(new String[]{
            "Corporate Law",
            "Criminal Law",
            "Constitutional Law",
            "International Law",
            "Tax Law",
            "Intellectual Property Law",
            "Human Rights Law",
            "Environmental Law",
            "Other"
        });
        pgPrograms.put("LLM", llm);
        
        // Design Programs
        EducationConfigDTO.ProgramConfig mdes = new EducationConfigDTO.ProgramConfig();
        mdes.setLabel("M.Des (Master of Design)");
        mdes.setSpecializations(new String[]{
            "Fashion Design",
            "Interior Design",
            "Graphic Design",
            "Product Design",
            "Industrial Design",
            "Textile Design",
            "Animation Design",
            "Other"
        });
        pgPrograms.put("MDES", mdes);
        
        EducationConfigDTO.ProgramConfig mfa = new EducationConfigDTO.ProgramConfig();
        mfa.setLabel("MFA (Master of Fine Arts)");
        mfa.setSpecializations(new String[]{
            "Painting",
            "Sculpture",
            "Applied Arts",
            "Visual Arts",
            "Digital Arts",
            "Other"
        });
        pgPrograms.put("MFA", mfa);
        
        // Education Programs
        EducationConfigDTO.ProgramConfig med = new EducationConfigDTO.ProgramConfig();
        med.setLabel("M.Ed (Master of Education)");
        med.setSpecializations(new String[]{
            "General",
            "Elementary Education",
            "Special Education",
            "Physical Education",
            "Educational Technology",
            "Other"
        });
        pgPrograms.put("MED", med);
        
        // Media Programs
        EducationConfigDTO.ProgramConfig mjmc = new EducationConfigDTO.ProgramConfig();
        mjmc.setLabel("MJMC (Master of Journalism and Mass Communication)");
        mjmc.setSpecializations(new String[]{
            "Print Journalism",
            "Electronic Journalism",
            "Digital Journalism",
            "Advertising",
            "Public Relations",
            "Film & Television",
            "Other"
        });
        pgPrograms.put("MJMC", mjmc);
        
        // Social Work
        EducationConfigDTO.ProgramConfig msw = new EducationConfigDTO.ProgramConfig();
        msw.setLabel("MSW (Master of Social Work)");
        msw.setSpecializations(new String[]{
            "General",
            "Community Development",
            "Child Welfare",
            "Women's Studies",
            "Medical Social Work",
            "Other"
        });
        pgPrograms.put("MSW", msw);
        
        // Healthcare Administration
        EducationConfigDTO.ProgramConfig mha = new EducationConfigDTO.ProgramConfig();
        mha.setLabel("MHA (Master of Healthcare Administration)");
        mha.setSpecializations(new String[]{
            "General",
            "Hospital Administration",
            "Public Health",
            "Other"
        });
        pgPrograms.put("MHA", mha);
        
        // Public Administration
        EducationConfigDTO.ProgramConfig mpa = new EducationConfigDTO.ProgramConfig();
        mpa.setLabel("MPA (Master of Public Administration)");
        mpa.setSpecializations(new String[]{
            "General",
            "Public Policy",
            "Urban Administration",
            "Other"
        });
        pgPrograms.put("MPA", mpa);
        
        // Other PG Programs
        EducationConfigDTO.ProgramConfig pgOther = new EducationConfigDTO.ProgramConfig();
        pgOther.setLabel("Other PG Degree");
        pgOther.setSpecializations(new String[]{"Other"});
        pgPrograms.put("PG_OTHER", pgOther);
        
        pg.setPrograms(pgPrograms);
        educationTypes.put("PG", pg);
        
        // PhD
        EducationConfigDTO.EducationTypeConfig phd = new EducationConfigDTO.EducationTypeConfig();
        phd.setLabel("PhD (Doctor of Philosophy)");
        Map<String, EducationConfigDTO.ProgramConfig> phdPrograms = new LinkedHashMap<>();
        
        EducationConfigDTO.ProgramConfig phdEngg = new EducationConfigDTO.ProgramConfig();
        phdEngg.setLabel("PhD in Engineering");
        phdEngg.setSpecializations(new String[]{
            "Computer Science & Engineering",
            "Electronics & Communication Engineering",
            "Electrical & Electronics Engineering",
            "Mechanical Engineering",
            "Civil Engineering",
            "Chemical Engineering",
            "Biotechnology",
            "Data Science",
            "Artificial Intelligence",
            "Other"
        });
        phdPrograms.put("PHD_ENG", phdEngg);
        
        EducationConfigDTO.ProgramConfig phdScience = new EducationConfigDTO.ProgramConfig();
        phdScience.setLabel("PhD in Science");
        phdScience.setSpecializations(new String[]{
            "Mathematics",
            "Physics",
            "Chemistry",
            "Biology",
            "Computer Science",
            "Statistics",
            "Biotechnology",
            "Environmental Science",
            "Other"
        });
        phdPrograms.put("PHD_SCI", phdScience);
        
        EducationConfigDTO.ProgramConfig phdManagement = new EducationConfigDTO.ProgramConfig();
        phdManagement.setLabel("PhD in Management");
        phdManagement.setSpecializations(new String[]{
            "Business Administration",
            "Finance",
            "Marketing",
            "Human Resources",
            "Operations",
            "Information Systems",
            "Other"
        });
        phdPrograms.put("PHD_MGMT", phdManagement);
        
        EducationConfigDTO.ProgramConfig phdMedical = new EducationConfigDTO.ProgramConfig();
        phdMedical.setLabel("PhD in Medical Sciences");
        phdMedical.setSpecializations(new String[]{
            "Medicine",
            "Pharmacy",
            "Nursing",
            "Public Health",
            "Biomedical Sciences",
            "Other"
        });
        phdPrograms.put("PHD_MED", phdMedical);
        
        EducationConfigDTO.ProgramConfig phdArts = new EducationConfigDTO.ProgramConfig();
        phdArts.setLabel("PhD in Arts/Humanities");
        phdArts.setSpecializations(new String[]{
            "English Literature",
            "History",
            "Political Science",
            "Economics",
            "Psychology",
            "Sociology",
            "Philosophy",
            "Languages",
            "Other"
        });
        phdPrograms.put("PHD_ARTS", phdArts);
        
        EducationConfigDTO.ProgramConfig phdLaw = new EducationConfigDTO.ProgramConfig();
        phdLaw.setLabel("PhD in Law");
        phdLaw.setSpecializations(new String[]{
            "Constitutional Law",
            "Corporate Law",
            "International Law",
            "Criminal Law",
            "Other"
        });
        phdPrograms.put("PHD_LAW", phdLaw);
        
        EducationConfigDTO.ProgramConfig phdEducation = new EducationConfigDTO.ProgramConfig();
        phdEducation.setLabel("PhD in Education");
        phdEducation.setSpecializations(new String[]{
            "Educational Technology",
            "Curriculum & Instruction",
            "Educational Psychology",
            "Other"
        });
        phdPrograms.put("PHD_EDU", phdEducation);
        
        EducationConfigDTO.ProgramConfig phdOther = new EducationConfigDTO.ProgramConfig();
        phdOther.setLabel("PhD in Other Field");
        phdOther.setSpecializations(new String[]{"Other"});
        phdPrograms.put("PHD_OTHER", phdOther);
        
        phd.setPrograms(phdPrograms);
        educationTypes.put("PhD", phd);
        
        config.setEducationTypes(educationTypes);
        return config;
    }
    
    public static String[] getGradingTypes() {
        return new String[]{"CGPA", "Percentage", "Grade", "GPA"};
    }
}

