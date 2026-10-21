package com._42students.lms.service.company;

import com.google.common.net.InternetDomainName;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * The one place that decides what a company domain is (recruiter phase 1, N4; design L1, P1-1). Everything that turns an
 * email, a website or a typed domain into a company domain goes through here: recruiter sign-up and invites, the TPO adding
 * a company or a recruiter email, Settings, super admin.
 *
 * A company domain is the registrable domain ({@code mail.omega.com} becomes {@code omega.com}, {@code omega.co.in} stays),
 * and it is refused when it is a personal or free mail provider, a disposable mail service, an academic domain (a student's
 * college address must never pass as a recruiter's company), an IP address, not a valid host, or (when asked) a domain that
 * cannot receive mail.
 */
@Service
public class CompanyDomainService {

    public enum Outcome {
        OK, INVALID, PERSONAL_MAIL, DISPOSABLE_MAIL, ACADEMIC, IP_ADDRESS, NO_MAIL
    }

    /** The verdict on one input: the normalised registrable domain (null when INVALID) and why it was refused, if it was. */
    public record Check(String domain, Outcome outcome) {
        public boolean ok() {
            return outcome == Outcome.OK;
        }

        /** Words a person can act on, for forms and API errors. */
        public String message() {
            return switch (outcome) {
                case OK -> "";
                case INVALID -> "Enter a valid company email or website";
                case PERSONAL_MAIL -> "Use a company email. Personal email (Gmail, Yahoo, Outlook and similar) can't be used";
                case DISPOSABLE_MAIL -> "Temporary email addresses can't be used";
                case ACADEMIC -> "College and university addresses can't be used for a company";
                case IP_ADDRESS -> "Use the company's domain name, not an IP address";
                case NO_MAIL -> "This domain doesn't receive email. Check the spelling";
            };
        }
    }

    /** Academic registrable suffixes: whatever sits under these belongs to an institution, not a company. */
    private static final List<String> ACADEMIC_SUFFIXES = List.of(".ac.in", ".edu.in", ".res.in", ".edu", ".ac.uk", ".edu.au", ".ac.nz",
            ".edu.sg", ".ac.jp", ".edu.cn");

    private static final Set<String> PERSONAL = load("company/personal-mail-domains.txt");
    private static final Set<String> DISPOSABLE = load("company/disposable-mail-domains.txt");

    private final MailDomainResolver resolver;

    public CompanyDomainService(MailDomainResolver resolver) {
        this.resolver = resolver;
    }

    /**
     * For code that only needs "is this a personal or throwaway mail domain?" without DNS (older services built directly in
     * tests). Same lists as every other check here.
     */
    public static boolean isPersonalOrDisposableDomain(String domainOrEmail) {
        String host = host(domainOrEmail);
        if (host == null) return false;
        String domain = registrable(host);
        return PERSONAL.contains(host) || DISPOSABLE.contains(host) || (domain != null && (PERSONAL.contains(domain) || DISPOSABLE.contains(domain)));
    }

    /** An email address: the part after the last {@code @} must be a company domain. Checks mail acceptance. */
    public Check checkEmail(String email) {
        if (email == null) return new Check(null, Outcome.INVALID);
        String e = email.trim().toLowerCase(Locale.ROOT);
        int at = e.lastIndexOf('@');
        if (at <= 0 || at == e.length() - 1 || e.indexOf(' ') >= 0) return new Check(null, Outcome.INVALID);
        return checkDomain(e.substring(at + 1), true);
    }

    /**
     * A typed domain, a website ({@code https://www.omega.com/careers}) or {@code @omega.com}. {@code requireMail} also
     * asks DNS whether the domain receives mail (a DNS failure never blocks: only a clear "no" does).
     */
    public Check checkDomain(String input, boolean requireMail) {
        String host = host(input);
        if (host == null) return new Check(null, Outcome.INVALID);
        if (host.matches("^[0-9.]+$") || host.contains(":")) return new Check(null, Outcome.IP_ADDRESS);
        String domain = registrable(host);
        if (domain == null) return new Check(null, Outcome.INVALID);
        if (PERSONAL.contains(domain) || PERSONAL.contains(host)) return new Check(domain, Outcome.PERSONAL_MAIL);
        if (DISPOSABLE.contains(domain) || DISPOSABLE.contains(host)) return new Check(domain, Outcome.DISPOSABLE_MAIL);
        for (String suffix : ACADEMIC_SUFFIXES) {
            if (("." + domain).endsWith(suffix)) return new Check(domain, Outcome.ACADEMIC);
        }
        if (requireMail && resolver.lookup(domain) == MailDomainResolver.Answer.NO_MAIL) return new Check(domain, Outcome.NO_MAIL);
        return new Check(domain, Outcome.OK);
    }

    /** True for personal and disposable mail providers (used where a free-mail address is allowed but must not name a company). */
    public boolean isPersonalOrDisposable(String domainOrEmail) {
        return isPersonalOrDisposableDomain(domainOrEmail);
    }

    /** Lower-cased host from a domain, an {@code @domain}, an email's domain part or a URL; null when nothing usable is left. */
    static String host(String input) {
        if (input == null) return null;
        String v = input.trim().toLowerCase(Locale.ROOT);
        if (v.isEmpty()) return null;
        v = v.replaceFirst("^@", "").replaceFirst("^[a-z][a-z0-9+.-]*://", "");
        int cut = indexOfAny(v, "/?#");
        if (cut >= 0) v = v.substring(0, cut);
        int at = v.lastIndexOf('@');
        if (at >= 0) v = v.substring(at + 1);
        if (v.startsWith("[")) return v.contains(":") ? v : null; // bracketed IPv6
        int port = v.lastIndexOf(':');
        if (port > 0 && v.indexOf(':') == port) v = v.substring(0, port);
        while (v.endsWith(".")) v = v.substring(0, v.length() - 1);
        if (v.isEmpty() || v.length() > 253) return null;
        return v;
    }

    /** {@code mail.omega.com} becomes {@code omega.com}; {@code omega.co.in} stays; null when the host has no registrable part. */
    static String registrable(String host) {
        try {
            if (!InternetDomainName.isValid(host)) return null;
            InternetDomainName name = InternetDomainName.from(host);
            if (!name.isUnderPublicSuffix()) return null;
            return name.topPrivateDomain().toString();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return null;
        }
    }

    private static int indexOfAny(String s, String chars) {
        int best = -1;
        for (char c : chars.toCharArray()) {
            int i = s.indexOf(c);
            if (i >= 0 && (best < 0 || i < best)) best = i;
        }
        return best;
    }

    private static Set<String> load(String resource) {
        Set<String> out = new HashSet<>();
        try (InputStream in = CompanyDomainService.class.getClassLoader().getResourceAsStream(resource)) {
            if (in == null) throw new IllegalStateException("Missing " + resource);
            try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) {
                    String d = line.trim().toLowerCase(Locale.ROOT);
                    if (!d.isEmpty() && !d.startsWith("#")) out.add(d);
                }
            }
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Could not read " + resource, e);
        }
        return Collections.unmodifiableSet(out);
    }
}
