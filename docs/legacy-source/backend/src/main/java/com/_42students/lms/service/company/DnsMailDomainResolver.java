package com._42students.lms.service.company;

import org.springframework.stereotype.Component;

import javax.naming.NameNotFoundException;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.time.Duration;
import java.time.Instant;
import java.util.Hashtable;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * DNS lookup through the JDK's JNDI DNS provider: MX first, then an address record (mail falls back to it). Short timeouts,
 * and answers are remembered for a day so a busy form never waits on DNS twice for the same domain. A timeout or DNS
 * failure is UNKNOWN, never NO_MAIL: a network hiccup must not stop a real company.
 */
@Component
public class DnsMailDomainResolver implements MailDomainResolver {

    private static final Duration KEEP = Duration.ofHours(24);
    private static final int MAX_CACHED = 5000;

    private record Cached(Answer answer, Instant at) {
    }

    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    @Override
    public Answer lookup(String domain) {
        if (domain == null || domain.isBlank()) return Answer.NO_MAIL;
        Cached hit = cache.get(domain);
        if (hit != null && hit.at().plus(KEEP).isAfter(Instant.now())) return hit.answer();
        Answer answer = ask(domain);
        if (answer != Answer.UNKNOWN) {
            if (cache.size() >= MAX_CACHED) cache.clear();
            cache.put(domain, new Cached(answer, Instant.now()));
        }
        return answer;
    }

    private Answer ask(String domain) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", "1500");
        env.put("com.sun.jndi.dns.timeout.retries", "1");
        DirContext ctx = null;
        try {
            ctx = new InitialDirContext(env);
            if (has(ctx, domain, "MX") || has(ctx, domain, "A") || has(ctx, domain, "AAAA")) return Answer.ACCEPTS_MAIL;
            return Answer.NO_MAIL;
        } catch (NameNotFoundException e) {
            return Answer.NO_MAIL;
        } catch (NamingException | RuntimeException e) {
            return Answer.UNKNOWN;
        } finally {
            if (ctx != null) {
                try { ctx.close(); } catch (NamingException ignored) { }
            }
        }
    }

    private static boolean has(DirContext ctx, String domain, String type) throws NamingException {
        try {
            Attributes attrs = ctx.getAttributes(domain, new String[]{type});
            Attribute a = attrs == null ? null : attrs.get(type);
            return a != null && a.size() > 0;
        } catch (NameNotFoundException e) {
            throw e;
        } catch (NamingException e) {
            // "no records of this type" comes back as a NamingException on some resolvers: treat as none.
            if (e.getClass().getSimpleName().contains("Timeout") || e.getClass().getSimpleName().contains("Communication")) throw e;
            return false;
        }
    }
}
