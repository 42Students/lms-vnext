package com._42students.lms.service;

import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.TenantDomainRepository;
import org.springframework.stereotype.Service;

import javax.naming.NamingEnumeration;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TenantDomainVerificationService {

    private final TenantDomainRepository tenantDomainRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public TenantDomainVerificationService(TenantDomainRepository tenantDomainRepository) {
        this.tenantDomainRepository = tenantDomainRepository;
    }

    public String generateToken() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public TenantDomain ensureToken(Integer domainId) {
        TenantDomain d = tenantDomainRepository.findById(domainId).orElse(null);
        if (d == null || Boolean.TRUE.equals(d.getIsDeleted())) return null;
        if (d.getVerificationToken() == null || d.getVerificationToken().trim().isEmpty()) {
            // Issue a first token WITHOUT touching verification status.
            //
            // This runs when a superadmin opens the "prove you own this address" dialog, which is
            // a read-only action from their point of view: it just shows the TXT record to publish.
            // It previously also cleared isVerified/verifiedAt, so any domain that was verified
            // before tokens existed (or seeded that way) — isVerified=true with no token — was
            // silently downgraded to unverified the moment someone clicked Verify/Recheck. Because
            // the matching TXT record has never been published for those hosts, verify() could
            // never restore it, so the status was lost for good and the buttons appeared broken.
            //
            // This is a first issuance, not a rotation, so there is no stale proof to invalidate.
            // Genuine status changes still happen only in verify(): markVerified() on success, and
            // markFailed() on failure (which deliberately records the diagnosis without revoking
            // an existing verification). Changing the host still clears both, in
            // TenantAdminController.updateDomain.
            d.setVerificationToken(generateToken());
            tenantDomainRepository.save(d);
        }
        return d;
    }

    /**
     * Verify by checking TXT records for either:
     * - _42lms-verify.<host> contains the exact token, OR
     * - <host> contains "42lms-verification=<token>"
     */
    public boolean verify(Integer domainId) {
        TenantDomain d = tenantDomainRepository.findById(domainId).orElse(null);
        if (d == null || Boolean.TRUE.equals(d.getIsDeleted())) return false;
        String host = d.getHost();
        String token = d.getVerificationToken();
        if (host == null || host.isEmpty() || token == null || token.isEmpty()) return false;

        Set<String> candidates = new LinkedHashSet<>();
        candidates.add("_42lms-verify." + host);
        candidates.add(host);

        List<String> allFound = new ArrayList<>();
        boolean anyLookupSucceeded = false;
        for (String name : candidates) {
            List<String> txts = lookupTxt(name);
            if (txts == null) continue;
            anyLookupSucceeded = true;
            for (String t : txts) {
                if (t == null) continue;
                String trimmed = t.trim();
                if (!trimmed.isEmpty()) allFound.add(trimmed);
                if (trimmed.equals(token)) return markVerified(d, allFound);
                if (trimmed.equalsIgnoreCase("42lms-verification=" + token)) return markVerified(d, allFound);
                if (trimmed.contains(token) && trimmed.toLowerCase().contains("42lms")) return markVerified(d, allFound);
            }
        }
        markFailed(d, !anyLookupSucceeded ? "TIMEOUT_OR_ERROR" : allFound.isEmpty() ? "NO_RECORD" : "WRONG_VALUE", allFound);
        return false;
    }

    private boolean markVerified(TenantDomain d, List<String> found) {
        d.setIsVerified(true);
        d.setVerifiedAt(LocalDateTime.now());
        d.setLastCheckedAt(LocalDateTime.now());
        d.setLastCheckResult("VERIFIED");
        d.setLastFoundValues(joinTruncated(found));
        tenantDomainRepository.save(d);
        return true;
    }

    private void markFailed(TenantDomain d, String reason, List<String> found) {
        d.setLastCheckedAt(LocalDateTime.now());
        d.setLastCheckResult(reason);
        d.setLastFoundValues(joinTruncated(found));
        tenantDomainRepository.save(d);
    }

    private String joinTruncated(List<String> values) {
        if (values == null || values.isEmpty()) return null;
        String joined = String.join(" | ", values);
        return joined.length() > 500 ? joined.substring(0, 500) : joined;
    }

    // Explicit public resolvers, tried only as a fallback if the platform's default resolver
    // (whatever /etc/resolv.conf inside the pod points at) fails outright. A containerized
    // deployment's default resolver is sometimes a cluster-internal DNS service that doesn't
    // reliably do full recursive lookups against arbitrary external domains — without this
    // fallback, that kind of infra misconfiguration makes every verification attempt fail with
    // "DNS lookup failed", indistinguishable from "the admin hasn't published the record yet",
    // and there would be no way to tell the two apart from this admin console alone.
    private static final String[] FALLBACK_DNS_SERVERS = { "8.8.8.8", "1.1.1.1" };

    // package-private (not private): TenantDomainVerificationServiceTest overrides this on a
    // subclass to supply canned DNS answers instead of making real network calls — verify()'s
    // own branching logic (VERIFIED/NO_RECORD/WRONG_VALUE/TIMEOUT_OR_ERROR) is what's under test,
    // not this codebase's ability to reach the real internet from wherever tests happen to run.
    List<String> lookupTxt(String name) {
        List<String> viaDefault = lookupTxtVia(name, null);
        if (viaDefault != null) return viaDefault;
        for (String server : FALLBACK_DNS_SERVERS) {
            List<String> viaFallback = lookupTxtVia(name, server);
            if (viaFallback != null) return viaFallback;
        }
        return null;
    }

    private List<String> lookupTxtVia(String name, String dnsServer) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            if (dnsServer != null) {
                env.put("java.naming.provider.url", "dns://" + dnsServer);
            }
            // Prevent long hangs on DNS when verifying domains (best-effort verification).
            // Values are milliseconds; retries kept low so superadmin "verify" stays responsive.
            env.put("com.sun.jndi.dns.timeout.initial", "2000");
            env.put("com.sun.jndi.dns.timeout.retries", "1");

            DirContext ctx = null;
            try {
                ctx = new InitialDirContext(env);
                Attributes attrs = ctx.getAttributes(name, new String[]{"TXT"});
                Attribute a = attrs.get("TXT");
                if (a == null) return Collections.emptyList();
                List<String> out = new ArrayList<>();
                NamingEnumeration<?> e = a.getAll();
                while (e.hasMore()) {
                    Object v = e.next();
                    if (v != null) {
                        // records sometimes come quoted; strip one layer
                        String s = String.valueOf(v);
                        out.add(unquote(s));
                    }
                }
                return out;
            } catch (javax.naming.NameNotFoundException noSuchName) {
                // A genuine "this name doesn't exist" answer from DNS — not a failure, just no
                // record. Distinct from the outer catch (timeout/network/malformed-response),
                // which the caller needs to tell apart from a real NO_RECORD.
                return Collections.emptyList();
            } finally {
                try { if (ctx != null) ctx.close(); } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {
            // Timeout, network error, or any other lookup failure — distinct from "queried fine,
            // found nothing" (caller uses null vs empty-list to tell NO_RECORD apart from
            // TIMEOUT_OR_ERROR). The caller falls back to the next resolver on null.
            return null;
        }
    }

    private String unquote(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.length() >= 2 && t.startsWith("\"") && t.endsWith("\"")) {
            return t.substring(1, t.length() - 1);
        }
        return t;
    }
}

