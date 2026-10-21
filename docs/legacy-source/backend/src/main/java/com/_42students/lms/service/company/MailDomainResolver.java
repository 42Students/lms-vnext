package com._42students.lms.service.company;

/** Answers "can this domain receive email?" (a DNS lookup in production, a fake in tests). */
public interface MailDomainResolver {

    enum Answer {
        /** The domain has MX records (or, failing that, an address record that mail can fall back to). */
        ACCEPTS_MAIL,
        /** The domain does not exist, or has neither MX nor address records. */
        NO_MAIL,
        /** DNS did not answer in time or failed: do not block anyone on a network hiccup. */
        UNKNOWN
    }

    Answer lookup(String domain);
}
