# Project template detail: legacy DTO to vNext published blueprint

The old LMS College Admin `/college-admin/projects/templates/:integerId` read `GET /api/v1/admin/project-templates/:id?collegeId=`. The vNext College Admin route is `/college/projects/templates/:templateId` and uses the server-side `getAssignedProjectTemplateDetail` service. Template identifiers are **UUIDs**, never legacy integers coerced to UUID strings; a historical import must maintain an explicit source-ID → vNext-UUID mapping before an old bookmarked URL can be resolved. Without such a mapping, show **Template not found**, not another college's record.

## Template identity and authorization

- `project_templates` is the global authored catalog; `project_template_versions` contains immutable versions and the JSONB blueprint. `project_template_college_assignments` authorizes a selected college to see its assigned **published** version. The read joins all three, filters `revoked_at IS NULL`, `status=PUBLISHED`, and the selected college UUID, and requires `projects.manage` in that scope.
- The vNext detail itself **is** the legacy template preview. The old `GET /preview` endpoint returned the same DTO and is deliberately not duplicated. Creating a workspace uses `/college/projects/create?templateId={encodedUUID}` and the common creation form (mentor + learner validation) rather than an unvalidated preview modal.
- Old fields `status`, `lifecycleStatus` map only to historical metadata or current catalog state, **never** bypassing authorization or lifecycle transitions. The published-version check must pass before enabling **Use this template**.

## Data-section mapping

| Old DTO | vNext published data | Presentation |
| --- | --- | --- |
| `name/title/summary` | `project_template_versions.title/summary` | Template information card; null summary is an em dash |
| `templateVersion/status/publishedAt` | Version number and global template status; last template publication update when verifiably current | Lifecycle tag, book-icon version tag and **Published at:** (em dash if not trustworthy) |
| `overview.goal`, `overview.deliverables` | `blueprint.overview.goal/deliverables` | One-column bordered **Overview** Descriptions; section count is the number of meaningful allowed fields, 0–2 |
| `sprints/tasks/resources` | `blueprint.sprints/tasks/resources` | Compact legacy Tags using title, then name, then label, then stable key as fallbacks; explicit "No {section} configured" for empty arrays |
| Legacy `delivery/meetings/activity` | Optional inert JSON metadata in published blueprint | Only displayed in collapsed **Additional template details**, never interpreted as executable settings |
| vNext `releases/definitionOfDone/submission` | Typed published blueprint | Preserved below legacy four cards, without altering primary four-section counts |

Legacy template normalization must not treat arbitrary DTO fields as new work tasks; store only validated blueprint sections and keep additional legacy metadata inert. An old template may not have compatible release and sprint linkages; in that case it can be viewed but **Use this template** remains disabled until it is converted and published as a valid vNext blueprint. For invalid UUIDs or revoked/not assigned records, show the selected-college-safe **Template not found** empty state; for a transient read error, show **Template could not be loaded** and Retry.
