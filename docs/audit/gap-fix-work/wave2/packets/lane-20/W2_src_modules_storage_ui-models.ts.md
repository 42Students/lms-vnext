# Work packet (wave 2): edit src/modules/storage/ui-models.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-069  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:493-509 — Specific 'A job description must be a PDF or a Word file'.
- vNext now: src/modules/storage/ui-models.ts:132-133 — Generic unsupported type message.
- Fix: Restore JD-specific message

## G2-10-027-071  [P2] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:429-435 — 'Too many upload requests. Please wait before trying again.'
- vNext now: src/modules/storage/ui-models.ts:127-148 — No matching upload-rate limit display.
- Fix: Add 429 toast/help

## G2-10-027-072  [P2] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-760 — Import429 'Too many import requests...'.
- vNext now: src/modules/storage/ui-models.ts:127-148 — No import-specific error.
- Fix: Restore source message for imported files

## G2-10-027-068  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:450-454 — Error 'File size must be greater than zero'.
- vNext now: src/modules/storage/ui-models.ts:133-136 — Error 'The file is empty or its size is not valid.'
- Fix: Use source error per input condition

## G2-10-027-070  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:579-591 — Video and lecture type-specific error texts.
- vNext now: src/modules/storage/ui-models.ts:131-145 — Generic 'This file type is not allowed'.
- Fix: Distinguish video/lecture/ppt/resume types
