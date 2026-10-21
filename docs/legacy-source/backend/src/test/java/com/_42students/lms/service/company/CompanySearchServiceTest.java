package com._42students.lms.service.company;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Strong company search (docs/companies/COMPANY-SEARCH-2026-10-13.md): every way people type a company finds it. */
class CompanySearchServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final CompanySearchService svc = new CompanySearchService(jdbc);
    private final List<Map<String, Object>> companies = new ArrayList<>();

    private void company(int id, String name, boolean verified) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", id); m.put("name", name); m.put("logoUrl", null); m.put("verified", verified ? 1 : 0);
        companies.add(m);
    }

    @BeforeEach
    void setUp() {
        company(1, "Infosys Limited", true);
        company(2, "Tata Consultancy Services", true);
        company(3, "Larsen & Toubro", false);
        company(4, "Tech Mahindra", true);
        company(5, "Accenture", true);
        company(6, "Cognizant", true);
        company(7, "Omega", true);
        company(8, "Omega Labs Pvt. Ltd.", false);
        company(9, "Zoho Corporation", false);
        when(jdbc.queryForList(contains("FROM company WHERE"), any(MapSqlParameterSource.class))).thenReturn(companies);
        when(jdbc.queryForList(contains("FROM company_alias"), any(MapSqlParameterSource.class))).thenReturn(List.of(
                Map.of("company_id", 6, "alias", "Cognizant Technology Solutions")));
        when(jdbc.queryForList(contains("FROM company_domain"), any(MapSqlParameterSource.class))).thenReturn(List.of(
                Map.of("company_id", 1, "domain", "infosys.com")));
        when(jdbc.queryForList(contains("FROM college_company"), any(MapSqlParameterSource.class))).thenReturn(List.of(
                Map.of("company_id", 1, "n", 12L)));
    }

    private String top(String q) {
        List<CompanySearchService.Hit> h = svc.search(q, null, 10);
        return h.isEmpty() ? null : h.get(0).name();
    }

    @Test
    void legalSuffixesCaseAndPunctuationDontMatter() {
        assertEquals("Infosys Limited", top("infosys ltd"));
        assertEquals("Infosys Limited", top("INFOSYS PVT. LTD."));
        assertEquals("Omega Labs Pvt. Ltd.", top("omega labs private limited"));
    }

    @Test
    void acronymsAndKnownShortNames() {
        assertEquals("Tata Consultancy Services", top("TCS"));
        assertEquals("Larsen & Toubro", top("L&T"));
        assertEquals("Larsen & Toubro", top("l and t"));
        assertEquals("Cognizant", top("CTS"), "a known short name");
        assertEquals("Short name: TCS", svc.search("tcs", null, 5).get(0).reason(), "says why, as typed");
        assertEquals("Short name: L&T", svc.search("L&T", null, 5).get(0).reason());
        assertEquals("Short name: l and t", svc.search("l and t", null, 5).get(0).reason());
    }

    @Test
    void aliasesKeptBy42() {
        CompanySearchService.Hit h = svc.search("cognizant technology solutions", null, 5).get(0);
        assertEquals("Cognizant", h.name());
        assertEquals("Also known as Cognizant Technology Solutions", h.reason());
    }

    @Test
    void wordOrderSpacingAndTypingInProgress() {
        assertEquals("Tech Mahindra", top("mahindra tech"));
        assertEquals("Tech Mahindra", top("TechMahindra"));
        assertEquals("Infosys Limited", top("infos"));
        assertEquals("Tata Consultancy Services", top("tata cons"));
    }

    @Test
    void typosFindTheCompanyAndSaySo() {
        CompanySearchService.Hit h = svc.search("Infosis", null, 5).get(0);
        assertEquals("Infosys Limited", h.name());
        assertTrue(h.fuzzy());
        assertEquals("Did you mean Infosys Limited?", h.reason());
        assertEquals("Accenture", top("acenture"));
        assertEquals("Accenture", top("accentrue"), "two letters swapped");
        assertEquals("Tech Mahindra", top("tech mahindraa"));
    }

    @Test
    void anExactNameBeatsALongerOneAndVerifiedRanksFirst() {
        List<CompanySearchService.Hit> h = svc.search("omega", null, 5);
        assertEquals("Omega", h.get(0).name());
        assertEquals("Omega Labs Pvt. Ltd.", h.get(1).name());
    }

    @Test
    void aWebsiteOrEmailThatBelongsToACompanyComesFirst() {
        CompanySearchService.Hit h = svc.search("hr@infosys.com", 1, 5).get(0);
        assertEquals("Infosys Limited", h.name());
        assertEquals("Matched infosys.com", h.reason());
    }

    @Test
    void unrelatedTextFindsNothing() {
        assertTrue(svc.search("qqqqqq", null, 5).isEmpty());
        assertTrue(svc.search("xy", null, 5).isEmpty());
    }

    @Test
    void theSameCompanyIsRecognisedButANearNameIsNot() {
        assertEquals(1, svc.sameCompany("Infosys Pvt Ltd").id());
        assertEquals(2, svc.sameCompany("TCS").id());
        assertEquals(6, svc.sameCompany("Cognizant Technology Solutions").id());
        assertNull(svc.sameCompany("Infosys BPM"), "a different company with a similar name is not blocked");
        assertNull(svc.sameCompany("Infosis"), "a typo is a suggestion, not a block");
    }

    @Test
    void engageNamesThatAreNotCompaniesAreOffered() {
        when(jdbc.queryForList(contains("FROM recruiter_lead WHERE college_id = :c"), any(MapSqlParameterSource.class), eq(String.class)))
                .thenReturn(List.of("Infosys Ltd", "Kumaran Systems", "kumaran systems pvt ltd", "Zoho"));
        assertEquals(List.of("Kumaran Systems"), svc.engageNames(6, "kumaran", 5), "Infosys is already a company; the two Kumaran spellings are one");
    }

    @Test
    void normalising() {
        assertEquals("larsen and toubro", CompanySearchService.norm("Larsen & Toubro Ltd."));
        assertEquals("zoho", CompanySearchService.norm("Zoho Corporation Pvt Ltd"));
        assertEquals("tcs", CompanySearchService.acronym(CompanySearchService.tokens("tata consultancy services")));
        assertEquals(1, CompanySearchService.bounded("infosis", "infosys", 2));
        assertEquals(1, CompanySearchService.bounded("accentrue", "accenture", 2), "a swap counts once");
        assertEquals(-1, CompanySearchService.bounded("zoho", "infosys", 2));
        assertFalse(CompanySearchService.allWordsPrefix(List.of("tech", "zoho"), List.of("tech", "mahindra")));
    }
}
