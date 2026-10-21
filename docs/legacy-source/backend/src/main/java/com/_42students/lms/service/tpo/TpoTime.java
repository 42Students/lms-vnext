package com._42students.lms.service.tpo;

import java.time.LocalDateTime;

/** JDBC drivers return DATETIME as either java.sql.Timestamp or LocalDateTime depending on version; read both the same way. */
final class TpoTime {
    private TpoTime() {}

    static LocalDateTime ldt(Object o) {
        if (o == null) return null;
        if (o instanceof LocalDateTime l) return l;
        if (o instanceof java.sql.Timestamp t) return t.toLocalDateTime();
        if (o instanceof java.util.Date d) return new java.sql.Timestamp(d.getTime()).toLocalDateTime();
        return LocalDateTime.parse(String.valueOf(o).replace(' ', 'T'));
    }
}
