package com._42students.lms.service.tpo;

import java.util.List;

/**
 * Mentioning or asking someone who is not in a private conversation: they would see the earlier messages, so the writer is asked
 * first ("Add Ravi? He will see the earlier messages") and sends again with addPeople = true.
 */
public class TeamNeedsAddingException extends RuntimeException {

    private final List<String> people;

    public TeamNeedsAddingException(List<String> people) {
        super("Add " + String.join(", ", people) + " to this private conversation? They will see the earlier messages.");
        this.people = people;
    }

    public List<String> getPeople() {
        return people;
    }
}
