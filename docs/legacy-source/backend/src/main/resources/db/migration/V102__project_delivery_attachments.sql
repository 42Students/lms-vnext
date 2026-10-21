-- Supports multiple attachments on a project's final delivery. Previously a single
-- attachment_url/source_url column meant every new file/link pasted by any team member
-- overwrote whatever the last person added — this column lets the team assemble the
-- submission additively instead. Existing single-field data is left as-is (still read as the
-- "primary" attachment); this is purely additive.
ALTER TABLE project_delivery
    ADD COLUMN attachments JSON NULL AFTER source_url;
