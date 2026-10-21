package com._42students.lms.search.colleges;

import com._42students.lms.model.College;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

/**
 * College Search Cache
 *
 * Provides fast in-memory search for colleges with:
 * - Fuzzy matching (typos)
 * - Synonym expansion (iit → indian institute of technology)
 * - Weighted ranking
 * - Multi-field search (name, city, state, etc.)
 */
@Component
@Slf4j
public class CollegeSearchCache extends GenericSearchCache<CollegeSearchDTO> {

    @Autowired
    private CollegeRepository collegeRepository;

    @PostConstruct
    public void init() {
        log.info("Initializing College Search Cache...");

        // Configure search behavior
        configure();

        // Load colleges from database
        loadColleges();

        log.info("College Search Cache initialized with {} colleges", size());
    }

    @Override
    protected void configure() {
        // Set which fields to search
        setSearchFieldsList(java.util.Arrays.asList(
            CollegeSearchDTO::getName,
            CollegeSearchDTO::getUniqueId,
            CollegeSearchDTO::getCity,
            CollegeSearchDTO::getState,
            CollegeSearchDTO::getCountry,
            CollegeSearchDTO::getAddressLine1,
            CollegeSearchDTO::getAddressLine2,
            CollegeSearchDTO::getLandmark
        ));

        // Add college-specific synonyms
        addSynonym("iit", "indian institute of technology");
        addSynonym("nit", "national institute of technology");
        addSynonym("iiit", "international institute of information technology");
        addSynonym("bits", "birla institute of technology and science");
        addSynonym("vit", "vellore institute of technology");
        addSynonym("srm", "srm institute of science and technology");
        addSynonym("amrita", "amrita vishwa vidyapeetham");
        addSynonym("anna", "anna university");
        addSynonym("manipal", "manipal institute of technology");
        addSynonym("pes", "pes university");
        addSynonym("rvce", "rv college of engineering");
        addSynonym("bmsce", "bms college of engineering");
        addSynonym("msrit", "ms ramaiah institute of technology");
        addSynonym("dsce", "dayananda sagar college of engineering");
        addSynonym("sjce", "sri jayachamarajendra college of engineering");
        addSynonym("nie", "national institute of engineering");
        addSynonym("jss", "jss science and technology university");
        addSynonym("atria", "atria institute of technology");
        addSynonym("cmr", "cmr institute of technology");
        addSynonym("acharya", "acharya institute of technology");
        addSynonym("new horizon", "new horizon college of engineering");
        addSynonym("oxford", "oxford college of engineering");
        addSynonym("presidency", "presidency university");
        addSynonym("christ", "christ university");
        addSynonym("mount carmel", "mount carmel college");
        addSynonym("st joseph", "st joseph college");
        addSynonym("university", "university");
        addSynonym("college", "college");
        addSynonym("institute", "institute");
        addSynonym("engineering", "engineering");
        addSynonym("technology", "technology");
        addSynonym("science", "science");
        addSynonym("management", "management");
        addSynonym("medical", "medical");
        addSynonym("pharmacy", "pharmacy");
        addSynonym("law", "law");

        // Set category field (by state/city)
        setCategoryField(CollegeSearchDTO::getState);
    }

    /**
     * Load colleges from database and convert to DTOs
     */
    private void loadColleges() {
        try {
            // Load all colleges
            List<College> colleges = collegeRepository.findAll();

            // Convert to DTOs
            List<CollegeSearchDTO> dtos = colleges.stream()
                .filter(college -> college.getIsDeleted() == null || !college.getIsDeleted())
                .map(this::toDTO)
                .collect(Collectors.toList());

            // Load into cache
            load(dtos);

            log.info("Loaded {} colleges from database", dtos.size());

        } catch (Exception e) {
            log.error("Failed to load colleges into cache", e);
        }
    }

    /**
     * Convert College entity to CollegeSearchDTO
     */
    private CollegeSearchDTO toDTO(College college) {
        return CollegeSearchDTO.builder()
            .id(college.getId())
            .name(college.getName())
            .logo(college.getLogo())
            .uniqueId(college.getUniqueId())
            .addressLine1(college.getAddressLine1())
            .addressLine2(college.getAddressLine2())
            .landmark(college.getLandmark())
            .city(college.getCity())
            .state(college.getState())
            .country(college.getCountry())
            .pinCode(college.getPinCode())
            .collegeChairId(college.getCollegeChairId())
            .collegeViceChairId(college.getCollegeViceChairId())
            .orgId(college.getOrgId())
            .build();
    }

    /**
     * Refresh cache (reload from database)
     */
    public void refresh() {
        log.info("Refreshing college search cache...");
        loadColleges();
    }

    /**
     * Get colleges by state
     */
    public List<CollegeSearchDTO> getByState(String state, int limit) {
        return allItems.stream()
            .filter(college -> college.getState() != null && college.getState().equalsIgnoreCase(state))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get colleges by city
     */
    public List<CollegeSearchDTO> getByCity(String city, int limit) {
        return allItems.stream()
            .filter(college -> college.getCity() != null && college.getCity().equalsIgnoreCase(city))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get colleges by organization
     */
    public List<CollegeSearchDTO> getByOrganization(Integer orgId, int limit) {
        return allItems.stream()
            .filter(college -> college.getOrgId() != null && college.getOrgId().equals(orgId))
            .limit(limit)
            .collect(Collectors.toList());
    }
}

