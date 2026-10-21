package com._42students.lms.service;

import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.TenantDomainRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * verify()'s own branching (VERIFIED / NO_RECORD / WRONG_VALUE / TIMEOUT_OR_ERROR) had zero test
 * coverage before this. lookupTxt is overridden on a subclass to supply canned DNS answers --
 * this is testing the branching logic itself, not this codebase's ability to reach the real
 * internet from wherever tests happen to run (see lookupTxt's own package-private visibility
 * note in the production class).
 */
class TenantDomainVerificationServiceTest {

    private static final int DOMAIN_ID = 5;
    private static final String HOST = "college.42lms.com";
    private static final String TOKEN = "abc123token";

    private TenantDomainRepository repo;

    /** A verification service whose DNS lookups are fully controlled by the test. */
    private static class FakeDnsVerificationService extends TenantDomainVerificationService {
        private final Function<String, List<String>> answers;

        FakeDnsVerificationService(TenantDomainRepository repo, Function<String, List<String>> answers) {
            super(repo);
            this.answers = answers;
        }

        @Override
        List<String> lookupTxt(String name) {
            return answers.apply(name);
        }
    }

    private TenantDomain domainWithToken() {
        TenantDomain d = new TenantDomain();
        d.setId(DOMAIN_ID);
        d.setHost(HOST);
        d.setVerificationToken(TOKEN);
        d.setIsVerified(false);
        return d;
    }

    @BeforeEach
    void setUp() {
        repo = Mockito.mock(TenantDomainRepository.class);
        when(repo.save(org.mockito.ArgumentMatchers.any(TenantDomain.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("the subdomain TXT record carrying the exact token verifies")
    void exactTokenAtSubdomain_verifies() {
        TenantDomain d = domainWithToken();
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        FakeDnsVerificationService svc = new FakeDnsVerificationService(repo, name ->
                name.equals("_42lms-verify." + HOST) ? List.of(TOKEN) : Collections.emptyList());

        boolean result = svc.verify(DOMAIN_ID);

        assertTrue(result);
        assertTrue(Boolean.TRUE.equals(d.getIsVerified()));
        assertEquals("VERIFIED", d.getLastCheckResult());
        assertNotNull(d.getVerifiedAt());
    }

    @Test
    @DisplayName("the documented alternative -- 42lms-verification=<token> on the bare host -- also verifies")
    void alternativeFormatOnBareHost_verifies() {
        TenantDomain d = domainWithToken();
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        FakeDnsVerificationService svc = new FakeDnsVerificationService(repo, name ->
                name.equals(HOST) ? List.of("42lms-verification=" + TOKEN) : Collections.emptyList());

        assertTrue(svc.verify(DOMAIN_ID));
        assertTrue(Boolean.TRUE.equals(d.getIsVerified()));
    }

    @Test
    @DisplayName("both lookups succeed but find nothing: NO_RECORD, not verified")
    void noTxtRecordsFound_marksNoRecord() {
        TenantDomain d = domainWithToken();
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        FakeDnsVerificationService svc = new FakeDnsVerificationService(repo, name -> Collections.emptyList());

        boolean result = svc.verify(DOMAIN_ID);

        assertFalse(result);
        assertFalse(Boolean.TRUE.equals(d.getIsVerified()));
        assertEquals("NO_RECORD", d.getLastCheckResult());
    }

    @Test
    @DisplayName("a TXT record is found but doesn't match the token: WRONG_VALUE")
    void wrongTxtValue_marksWrongValue() {
        TenantDomain d = domainWithToken();
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        FakeDnsVerificationService svc = new FakeDnsVerificationService(repo, name ->
                List.of("some-other-unrelated-value"));

        boolean result = svc.verify(DOMAIN_ID);

        assertFalse(result);
        assertEquals("WRONG_VALUE", d.getLastCheckResult());
        assertTrue(d.getLastFoundValues().contains("some-other-unrelated-value"));
    }

    @Test
    @DisplayName("both lookups fail outright (timeout/network): TIMEOUT_OR_ERROR, distinct from NO_RECORD")
    void bothLookupsFail_marksTimeoutOrError() {
        TenantDomain d = domainWithToken();
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        FakeDnsVerificationService svc = new FakeDnsVerificationService(repo, name -> null);

        boolean result = svc.verify(DOMAIN_ID);

        assertFalse(result);
        assertEquals("TIMEOUT_OR_ERROR", d.getLastCheckResult());
    }

    @Test
    @DisplayName("verifying an already-verified domain that briefly fails a recheck does not revoke its verification")
    void failedRecheck_doesNotRevokeExistingVerification() {
        TenantDomain d = domainWithToken();
        d.setIsVerified(true);
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        FakeDnsVerificationService svc = new FakeDnsVerificationService(repo, name -> Collections.emptyList());

        svc.verify(DOMAIN_ID);

        // markFailed only records the diagnosis; it never sets isVerified back to false. A
        // transient DNS hiccup on a recheck must not silently un-verify a working domain.
        assertTrue(Boolean.TRUE.equals(d.getIsVerified()));
        assertEquals("NO_RECORD", d.getLastCheckResult());
    }

    @Test
    @DisplayName("ensureToken issues a token without touching an existing verification status")
    void ensureToken_firstIssuance_doesNotTouchVerificationStatus() {
        TenantDomain d = new TenantDomain();
        d.setId(DOMAIN_ID);
        d.setHost(HOST);
        d.setIsVerified(true); // seeded/legacy: verified with no token on record yet
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        TenantDomainVerificationService svc = new TenantDomainVerificationService(repo);

        TenantDomain result = svc.ensureToken(DOMAIN_ID);

        assertNotNull(result.getVerificationToken());
        // This is the exact regression the production code's own comment describes: issuing a
        // first token must never downgrade an already-verified domain to unverified.
        assertTrue(Boolean.TRUE.equals(result.getIsVerified()));
    }

    @Test
    @DisplayName("ensureToken does not regenerate a token that already exists")
    void ensureToken_existingToken_isNotRegenerated() {
        TenantDomain d = domainWithToken();
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        TenantDomainVerificationService svc = new TenantDomainVerificationService(repo);

        TenantDomain result = svc.ensureToken(DOMAIN_ID);

        assertEquals(TOKEN, result.getVerificationToken());
    }

    @Test
    @DisplayName("a deleted domain returns null/false rather than throwing")
    void deletedDomain_isNotVerifiedOrTokenized() {
        TenantDomain d = domainWithToken();
        d.setIsDeleted(true);
        when(repo.findById(DOMAIN_ID)).thenReturn(Optional.of(d));
        TenantDomainVerificationService svc = new TenantDomainVerificationService(repo);

        assertNull(svc.ensureToken(DOMAIN_ID));
        assertFalse(svc.verify(DOMAIN_ID));
    }
}
