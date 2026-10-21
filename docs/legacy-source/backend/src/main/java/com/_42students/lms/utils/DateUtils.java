package com._42students.lms.utils;

import org.springframework.context.annotation.Configuration;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Optional;

@Configuration
public class DateUtils {

    private static final String dateFormat = "yyyy-MM-dd";
    private static final String dateTimeFormat = "yyyy-MM-dd HH:mm:ss";
    private static final String TIMEFORMAT = "HH:mm:ss";

    /**
     * Safe parse: returns Optional.empty() for null, blank, or invalid date string.
     * Use in controllers and return 400 when empty.
     */
    public Optional<Date> parseDateSafe(String date) {
        if (date == null || date.trim().isEmpty()) return Optional.empty();
        try {
            DateFormat formatter = new SimpleDateFormat(dateFormat);
            formatter.setLenient(false);
            return Optional.of(formatter.parse(date.trim()));
        } catch (ParseException e) {
            return Optional.empty();
        }
    }

    /**
     * Safe parse end-of-day (23:59:59). Returns Optional.empty() for null, blank, or invalid date.
     */
    public Optional<Date> parseEndDateSafe(String date) {
        if (date == null || date.trim().isEmpty()) return Optional.empty();
        try {
            DateFormat formatter = new SimpleDateFormat(dateFormat);
            formatter.setLenient(false);
            Date d = formatter.parse(date.trim());
            d.setHours(23);
            d.setMinutes(59);
            d.setSeconds(59);
            return Optional.of(d);
        } catch (ParseException e) {
            return Optional.empty();
        }
    }

    public Date getDateFormat(String date) throws ParseException {
        DateFormat formatter1 = new SimpleDateFormat(dateFormat);
        return formatter1.parse(date);
    }

    /** Parses a time-only string (HH:mm:ss). */
    public Date getTimeFormat(String date) throws ParseException {
        DateFormat formatter1 = new SimpleDateFormat(TIMEFORMAT);
        return formatter1.parse(date);
    }

    /** @deprecated Use {@link #getTimeFormat(String)} instead. */
    @Deprecated
    public Date getDateTimeFormat(String date) throws ParseException {
        return getTimeFormat(date);
    }

    public Date getEndDateFormat(String date) throws ParseException {
        DateFormat formatter1 = new SimpleDateFormat(dateFormat);
        Date date1 = formatter1.parse(date);
        date1.setHours(23);
        date1.setMinutes(59);
        date1.setSeconds(59);
        return date1;
    }

    public Date getEndDateTimeFormat(String date) throws ParseException {
        DateFormat formatter1 = new SimpleDateFormat(dateTimeFormat);
        Date date1 = formatter1.parse(date);
        date1.setHours(23);
        date1.setMinutes(59);
        date1.setSeconds(59);
        return date1;
    }

    public String getFormattedDateTime(Date date) throws ParseException {
        DateFormat formatter = new SimpleDateFormat(dateTimeFormat);
        return formatter.format(date);
    }
    public String getFormattedDate(Date date) throws ParseException {
        DateFormat formatter = new SimpleDateFormat(dateFormat);
        return formatter.format(date);
    }
    public String getFormattedTime(Date date) throws ParseException {
        DateFormat formatter = new SimpleDateFormat(TIMEFORMAT);
        return formatter.format(date);
    }
}

