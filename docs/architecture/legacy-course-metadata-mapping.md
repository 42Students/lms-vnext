# Legacy course metadata field disposition (14 fields)

Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:20-34`.
Destination: `src/db/schema/courses.ts:37-69`. The legacy JSON uses lowercase-with-underscores; preserve original JSON in `legacyMetadata` on import, then extract only validated fields.

| Legacy field | vNext field or disposition |
| --- | --- |
| `amount` | `legacyPriceInr`; confirm unit and integer limits before coercion |
| `image_url` | `imageUrl`; external URL must be validated and safely rendered |
| `takeaways` | `orderedTakeaways` (preserves order); `takeaways` is derived display text |
| `course_code` | `code` or `officialCode`; preserve conflict as source JSON and require precedence decision |
| `course_type` | `legacyCourseType` |
| `course_color` | `cardColor`, only valid #RRGGBB |
| `image_url_lp` | `imageUrlLearningPath` |
| `course_category` | `legacyCategory` |
| `course_end_date` | `legacyCourseEndDateText`, never infer timezone |
| `course_start_date` | `legacyCourseStartDateText`, never infer timezone |
| `introduction_content` | `introductionHeading` for display-safe plain heading/text; preserve full original in `legacyMetadata` |
| `html_content` | `legacyIntroductionHtml`; **never render unsanitized HTML** |
| `updated_on` | Retain verbatim in `legacyMetadata`; do not override DB `updatedAt` without recognized format and provenance |
| `thumbnail` | `thumbnailUrl`; validate link and access scope |

**No field may be silently retired.** The `updated_on` source string is intentionally retained only in provenance pending date-format reconciliation. Existing legacy public image addresses require a guarded migration to private signed storage; preserved URLs are not proof that assets remain accessible. Null, missing and malformed source values should remain inspectable in provenance and produce an accessible fallback at rendering boundaries, not be silently converted to invented values.

This document is an explicit disposition rationale, **not** proof of a deployed converter, successful historic import, valid signed media URLs or sanitized course HTML. Those are separate implementation and release gates.
