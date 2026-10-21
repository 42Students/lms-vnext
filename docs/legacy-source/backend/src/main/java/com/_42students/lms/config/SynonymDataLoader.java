package com._42students.lms.config;

import com._42students.lms.model.Skill;
import com._42students.lms.model.SkillSynonym;
import com._42students.lms.repository.SkillRepository;
import com._42students.lms.repository.SkillSynonymRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Loads common skill synonyms into the database
 * Run after SkillsDataLoader to ensure skills exist
 */
@Component
@Order(2) // Run after SkillsDataLoader (Order 1)
@Slf4j
public class SynonymDataLoader implements CommandLineRunner {
    
    @Autowired
    private SkillRepository skillRepository;
    
    @Autowired
    private SkillSynonymRepository synonymRepository;
    
    @Value("${lms.skills.synonyms.load.enabled:false}")
    private boolean loadEnabled;
    
    // Map of skill name -> list of synonyms
    private static final Map<String, List<String>> SKILL_SYNONYMS = new LinkedHashMap<>();
    
    static {
        // Programming Languages
        SKILL_SYNONYMS.put("javascript", Arrays.asList("js", "ecmascript", "es6", "es2015"));
        SKILL_SYNONYMS.put("typescript", Arrays.asList("ts"));
        SKILL_SYNONYMS.put("python", Arrays.asList("py", "python3", "python2"));
        SKILL_SYNONYMS.put("c++", Arrays.asList("cpp", "cplusplus"));
        SKILL_SYNONYMS.put("c#", Arrays.asList("csharp", "c sharp", "dotnet"));
        SKILL_SYNONYMS.put("ruby", Arrays.asList("rb", "ruby on rails"));
        SKILL_SYNONYMS.put("go", Arrays.asList("golang", "go lang"));
        SKILL_SYNONYMS.put("kotlin", Arrays.asList("kt"));
        SKILL_SYNONYMS.put("swift", Arrays.asList("ios swift"));
        
        // Frameworks
        SKILL_SYNONYMS.put("react", Arrays.asList("reactjs", "react.js"));
        SKILL_SYNONYMS.put("react native", Arrays.asList("rn", "reactnative"));
        SKILL_SYNONYMS.put("angular", Arrays.asList("ng", "angularjs", "angular.js"));
        SKILL_SYNONYMS.put("vue.js", Arrays.asList("vue", "vuejs"));
        SKILL_SYNONYMS.put("node.js", Arrays.asList("node", "nodejs"));
        SKILL_SYNONYMS.put("express.js", Arrays.asList("express", "expressjs"));
        SKILL_SYNONYMS.put("spring boot", Arrays.asList("spring", "springboot"));
        SKILL_SYNONYMS.put("django", Arrays.asList("python django"));
        SKILL_SYNONYMS.put("flask", Arrays.asList("python flask"));
        SKILL_SYNONYMS.put("next.js", Arrays.asList("next", "nextjs"));
        
        // Cloud & DevOps
        SKILL_SYNONYMS.put("kubernetes", Arrays.asList("k8s", "kube"));
        SKILL_SYNONYMS.put("docker", Arrays.asList("containerization", "containers"));
        SKILL_SYNONYMS.put("amazon web services", Arrays.asList("aws"));
        SKILL_SYNONYMS.put("google cloud platform", Arrays.asList("gcp", "google cloud"));
        SKILL_SYNONYMS.put("microsoft azure", Arrays.asList("azure", "az"));
        SKILL_SYNONYMS.put("continuous integration", Arrays.asList("ci"));
        SKILL_SYNONYMS.put("continuous deployment", Arrays.asList("cd"));
        SKILL_SYNONYMS.put("jenkins", Arrays.asList("ci/cd", "cicd"));
        SKILL_SYNONYMS.put("terraform", Arrays.asList("tf", "iac"));
        
        // Data & AI
        SKILL_SYNONYMS.put("machine learning", Arrays.asList("ml"));
        SKILL_SYNONYMS.put("artificial intelligence", Arrays.asList("ai"));
        SKILL_SYNONYMS.put("deep learning", Arrays.asList("dl", "neural networks"));
        SKILL_SYNONYMS.put("natural language processing", Arrays.asList("nlp"));
        SKILL_SYNONYMS.put("computer vision", Arrays.asList("cv", "image recognition"));
        SKILL_SYNONYMS.put("data science", Arrays.asList("ds"));
        SKILL_SYNONYMS.put("data analysis", Arrays.asList("analytics", "data analytics"));
        SKILL_SYNONYMS.put("data engineering", Arrays.asList("de", "etl"));
        
        // Databases
        SKILL_SYNONYMS.put("postgresql", Arrays.asList("postgres", "psql"));
        SKILL_SYNONYMS.put("mongodb", Arrays.asList("mongo"));
        SKILL_SYNONYMS.put("mysql", Arrays.asList("sql"));
        SKILL_SYNONYMS.put("elasticsearch", Arrays.asList("elastic", "es"));
        SKILL_SYNONYMS.put("redis", Arrays.asList("cache", "in-memory db"));
        
        // Other Technical
        SKILL_SYNONYMS.put("rest api", Arrays.asList("api", "restful", "rest"));
        SKILL_SYNONYMS.put("graphql", Arrays.asList("gql"));
        SKILL_SYNONYMS.put("git", Arrays.asList("github", "gitlab", "version control"));
        SKILL_SYNONYMS.put("linux", Arrays.asList("unix", "bash", "shell"));
        SKILL_SYNONYMS.put("microservices", Arrays.asList("micro services", "msa"));
        
        // Soft Skills
        SKILL_SYNONYMS.put("project management", Arrays.asList("pm", "pmp"));
        SKILL_SYNONYMS.put("quality assurance", Arrays.asList("qa", "testing"));
        SKILL_SYNONYMS.put("user experience", Arrays.asList("ux", "uxd"));
        SKILL_SYNONYMS.put("user interface", Arrays.asList("ui", "uid"));
        SKILL_SYNONYMS.put("agile", Arrays.asList("scrum", "kanban", "agile methodology"));
    }
    
    @Override
    @Transactional
    public void run(String... args) {
        if (!loadEnabled) {
            log.info("Synonym loading is disabled. Set lms.skills.synonyms.load.enabled=true to enable.");
            return;
        }
        
        // Check if synonyms already exist
        if (synonymRepository.count() > 0) {
            log.info("Skill synonyms already loaded ({} entries). Skipping.", synonymRepository.count());
            return;
        }
        
        log.info("Starting skill synonym data load...");
        int synonymsAdded = 0;
        int skillsNotFound = 0;
        
        for (Map.Entry<String, List<String>> entry : SKILL_SYNONYMS.entrySet()) {
            String skillName = entry.getKey();
            List<String> synonyms = entry.getValue();
            
            // Find the skill in database
            Optional<Skill> skillOpt = skillRepository.findByNameIgnoreCase(skillName);
            
            if (skillOpt.isEmpty()) {
                // Try partial match
                List<Skill> matches = skillRepository.searchSkillsRanked(skillName, 1);
                if (!matches.isEmpty()) {
                    skillOpt = Optional.of(matches.get(0));
                }
            }
            
            if (skillOpt.isPresent()) {
                Skill skill = skillOpt.get();
                
                for (String synonym : synonyms) {
                    if (!synonymRepository.existsBySynonym(synonym.toLowerCase())) {
                        SkillSynonym skillSynonym = new SkillSynonym(skill, synonym);
                        synonymRepository.save(skillSynonym);
                        synonymsAdded++;
                    }
                }
            } else {
                skillsNotFound++;
                log.debug("Skill not found for synonyms: {}", skillName);
            }
        }
        
        log.info("Synonym loading complete. Added {} synonyms. Skills not found: {}", 
                 synonymsAdded, skillsNotFound);
    }
}


