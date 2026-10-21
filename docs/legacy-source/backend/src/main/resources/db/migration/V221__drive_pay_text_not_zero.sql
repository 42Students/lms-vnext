-- V221: drive pay text not zero
-- Idempotent where practical; rehearse against a copy of the target database first.


-- A drive's pay line (job.ctc_range) read "0 LPA" when its pay wasn't set yet or it was a stipend-only internship: a missing CTC
-- was counted as zero (night audit 13 Oct 2026; TpoDriveService.ctcRangeOf now skips it). Those lines become the stipend
-- ("₹25,000 a month") when the drive has one, otherwise empty. Only the exact zero forms are touched.
-- The stipend is read only when it is a JSON number: CAST of a JSON null ("null") to DECIMAL is an error inside an UPDATE in strict
-- mode (the first version of this file failed on a drive with no stipend, on the local copy; it never ran on dev or prod).
UPDATE job
SET ctc_range = CASE
    WHEN JSON_TYPE(JSON_EXTRACT(role_options_json, '$[0].stipendPerMonth')) IN ('INTEGER', 'UNSIGNED INTEGER', 'DECIMAL', 'DOUBLE')
         AND JSON_EXTRACT(role_options_json, '$[0].stipendPerMonth') > 0
      THEN CONCAT('₹', FORMAT(JSON_EXTRACT(role_options_json, '$[0].stipendPerMonth'), 0, 'en_IN'), ' a month')
    ELSE NULL
  END
WHERE ctc_range IN ('0 LPA', '0.0 LPA', '0.00 LPA', '0-0 LPA', '0.0-0.0 LPA', '0.00-0.00 LPA');
