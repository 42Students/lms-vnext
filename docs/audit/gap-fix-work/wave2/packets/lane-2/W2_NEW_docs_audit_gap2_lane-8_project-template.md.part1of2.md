# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/project-template.md (part 1 of 2)

40 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/project-template.md

## G2-8-017-001  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:228-239 page header “Project templates”, URL /superadmin/projects/templates
- vNext now: VFE/admin/projects/templates/page.tsx:57-61 heading “Templates”, URL /admin/projects/templates
- Fix: Keep legacy visible title 'Project templates' and old-nav alias for bookmarks.

## G2-8-017-002  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/superadmin/projects/templates/[templateId]/index.js:6-19 detail redirects to /overview retaining query
- vNext now: VFE/admin/projects/templates/[templateId]/overview/page.tsx:6-12 overview alias redirects to canonical subview
- Fix: Verify canonical detail preserves legacy query parameters, including direct links; add query pass-through if absent.

## G2-8-017-003  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:235-238 Create template enters /superadmin/projects/templates/new
- vNext now: VFE/admin/projects/templates/page.tsx:58-60 New template → links /admin/projects/templates/new
- Fix: Match exact route alias and 'Create template' label; preserve new-template flow.

## G2-8-017-004  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:227-249,303-326 shell → header → Templates card with filters in card header → table
- vNext now: VFE/admin/projects/templates/page.tsx:57-77 PageHeader → ProjectAdminNav → filter strip → ListToolbar → table
- Fix: Use legacy shell/card hierarchy and position filters inside titled Templates card, without nested cards.

## G2-8-017-005  [P2] GAP  facet F02  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:246-247 card title “Templates”
- vNext now: VFE/admin/projects/templates/page.tsx:74-75 ListToolbar label “Global project templates”
- Fix: Restore card heading “Templates” instead of new toolbar heading.

## G2-8-017-006  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:235-238 primary “Create template”
- vNext now: VFE/admin/projects/templates/page.tsx:60 primary “New template →”
- Fix: Use exact 'Create template' label and legacy arrow-free treatment.

## G2-8-017-007  [P2] GAP  facet F03  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:156-190 Template summary, Version, Lifecycle tag, four counts Overview/Sprints/Tasks/Resources
- vNext now: VFE/admin/projects/templates/page.tsx:82-100 template slug, status, four badges, Versions string and assignments count
- Fix: Restore count on Overview chip; retain slug/assignments as explicit new metadata if product-approved.

## G2-8-017-008  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:196-219 “Open” and “Archive” actions; disabled archive if archived
- vNext now: VFE/admin/projects/templates/page.tsx:101-107 “Inspect template →” and separate archive control
- Fix: Use exact 'Open' and 'Archive' copy and disabled handling for archived rows.

## G2-8-017-012  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:166-175 version displayed as bare templateVersion; lifecycle rendered via statusLabel()
- vNext now: VFE/admin/projects/templates/page.tsx:88-100 raw enum status and “Version X · published Y”
- Fix: Display legacy lifecycle label casing and bare version in grid; place published version in detail.

## G2-8-017-013  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:159-162 normaliseCollegeScopedName and textOrDash on missing summary
- vNext now: VFE/admin/projects/templates/page.tsx:82-87 raw title, slug line, summary hidden when null
- Fix: Show '—' summary placeholder and legacy title fallback; do not suppress empty field.

## G2-8-017-014  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:180-190 section counts from each original independent JSON field
- vNext now: VFE/admin/projects/templates/page.tsx:90-96 overview badge without count, other counts from blueprint
- Fix: Compute/show Overview count and define conversion for missing optional sections.

## G2-8-017-015  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:155-223 5 grid columns Template, Version, Lifecycle, Sections, Action
- vNext now: VFE/admin/projects/templates/page.tsx:81-107 6 columns Template, Status, Sections, Versions, Assignments, Action
- Fix: Restore legacy grid columns/order; explicitly approve any extra Assignments column.

## G2-8-017-017  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:250-256 Input.Search allowClear, 240px, client-change triggers debounced refetch
- vNext now: VFE/admin/projects/templates/page.tsx:62-73 GET form requires Filter submit; q has maxLength 100
- Fix: Restore type-to-filter with clear X and preserved URL query state; avoid mandatory Filter click.

## G2-8-017-018  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:257-269 status selector optional allowClear, labels Draft/Published/Archived
- vNext now: VFE/admin/projects/templates/page.tsx:67-70 required ALL/DRAFT/PUBLISHED/ARCHIVED uppercase options
- Fix: Use legacy display labels and clearable status filter; translate ALL to no filter.

## G2-8-017-021  [P2] GAP  facet F06  effort M
- Legacy: LBE/model/ProjectTemplate.java:22-26,28-32 slug max80/title max160, both not null
- vNext now: V/modules/projects/validation.ts:12-19,247-254 slug min1 max64 lowercase hyphen key/title min1 max200
- Fix: Resolve max lengths and slug regex against legacy editor and MySQL; show exact guidance before save.

## G2-8-017-024  [P2] GAP  facet F06  effort L
- Legacy: LBE/model/ProjectTemplate.java:33-44 status defaults IN_PROGRESS, templateVersion1, lifecycle DRAFT
- vNext now: V/db/schema/projects.ts:33-39 status defaults DRAFT, currentVersion1, publishedVersion null
- Fix: Split workflow status from lifecycle for legacy data; don't conflate IN_PROGRESS and DRAFT.

## G2-8-017-035  [P2] GAP  facet F10  effort L
- Legacy: LBE/controller/AdminProjectTemplateController.java:63-124 GET global directory/detail/preview under admin-project templates
- vNext now: V/modules/projects/template-service.ts:97-237 list/detail and assigned read; UUID routes
- Fix: Maintain route-compatibility for numeric legacy IDs and preview alias where needed.

## G2-8-017-036  [P2] GAP  facet F10  effort M
- Legacy: LBE/controller/AdminProjectTemplateController.java:201-266 POST create, PUT edit, POST duplicate returning DTO
- vNext now: V/modules/projects/template-service.ts:241-375,538-634 transactional create/revise/duplicate with version records and activities
- Fix: Document route/payload/status code mapping; provide compatibility adapter if external clients exist.

## G2-8-017-045  [P2] GAP  facet F12  effort M
- Legacy: LBE/repository/ProjectTemplateRepository.java:37-47 archived isDeleted=true yet visible when filtered Archived
- vNext now: V/db/schema/projects.ts:33-35,45-47; VFE/admin/projects/templates/page.tsx:22,67-69 ARCHIVED status remains listable
- Fix: Preserve archive visibility and soft-delete semantics in query; review restore expectations.

## G2-8-017-046  [P2] GAP  facet F12  effort M
- Legacy: LBE/service/ProjectWorkspaceService.java:51-68 revision and bulk assignment optional expected-version/expected-college CAS
- vNext now: V/modules/projects/template-service.ts:317-340,699-716 transaction locks for revisions/assignment
- Fix: Verify replace-all assignment protects against stale expected college IDs; add compare-and-swap if absent.

## G2-8-017-047  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:303-325 first load Skeleton 6 paragraphs; on refetch keep table under loading overlay
- vNext now: VFE/admin/projects/templates/page.tsx:26-55 async server render; separate route loading.tsx
- Fix: Clone initial six-row skeleton and refetch overlay, not blank or abrupt table swap.

## G2-8-017-048  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:309-325 suppress empty table on server error; empty copy “No templates match your filters”
- vNext now: VFE/admin/projects/templates/page.tsx:48-54,109-110 error-only response; empty “No matching templates”
- Fix: Use legacy empty copy and avoid error/empty overlap.

## G2-8-017-049  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:242-243 dismiss-less Alert “Templates could not be loaded” + Retry
- vNext now: VFE/admin/projects/templates/page.tsx:50-54 ErrorState “Project templates unavailable” + Retry loading templates
- Fix: Use error alert copy and matching retry label, preserve filters.

## G2-8-017-053  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:249-263,314-320 fixed 240px search, Space wrap, horizontally scrollable table x=max-content
- vNext now: VFE/admin/projects/templates/page.tsx:62-73,77-108 responsive 1-column GET form and DataTable mobile priorities
- Fix: Match horizontal-scroll behavior and filter wrapping at 375/768/1280; test mobile overflow later.

## G2-8-017-055  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:232-237 “Project templates” / “Create template”
- vNext now: VFE/admin/projects/templates/page.tsx:58-60 “Templates” / “New template →”
- Fix: Restore exact legacy strings including case and no arrow.

## G2-8-017-056  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:250-269 “Search title or slug” / “Lifecycle status”
- vNext now: VFE/admin/projects/templates/page.tsx:63-72 “Template title or slug” / “Status” / “Filter”
- Fix: Restore search placeholder and Lifecycle status label; keep Filter only if UX explicitly approves submit.

## G2-8-017-057  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:313-324 “No templates match your filters”
- vNext now: VFE/admin/projects/templates/page.tsx:109-110 “No matching templates”
- Fix: Restore exact empty-state string.

## G2-8-017-058  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:196-208 “Open”, “Archive”
- vNext now: VFE/admin/projects/templates/page.tsx:103-106 “Inspect template →”
- Fix: Restore action wording, including simple 'Open' icon treatment.

## G2-8-017-060  [P2] GAP  facet F19  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:120-124,303-320 debounced search (~350ms), preserve old rows during refetch
- vNext now: VFE/admin/projects/templates/page.tsx:62-73 full route GET submit; paginated query
- Fix: Restore debounce for typing and stale-response guard where client fetch retained.

## G2-8-017-064  [P2] GAP  facet F20  effort S
- Legacy: LBE/repository/ProjectTemplateRepository.java:56-62 NULL updatedAt last, id descending tie break
- vNext now: V/db/schema/projects.ts:53-57; V/modules/projects/template-service.ts:97-109 updatedAt non-null, title sort; UUID ID
- Fix: Define deterministic sort tie-break and timestamp normalization for old data.

## G2-8-017-065  [P2] GAP  facet F20  effort M
- Legacy: LBE/model/BaseModel.java:28-37; LBE/model/ProjectTemplate.java:47-56 LocalDateTime without TZ, version Long nullable
- vNext now: V/db/schema/projects.ts:45-57; V/modules/projects/template-service.ts:317-340 timestamptz and numeric currentVersion
- Fix: Normalize legacy timestamps to IST at migration boundary; do not misread local datetime as UTC.

## G2-8-017-068  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectTemplate.java:22-26 slug VARCHAR(80) not null
- vNext now: V/db/schema/projects.ts:29-30 VARCHAR(96) not null; lower(slug) unique index at 60-62
- Fix: Choose canonical max length, enforce same in schema and validator.

## G2-8-017-069  [P2] GAP  facet F22  effort S
- Legacy: LBE/model/ProjectTemplate.java:28-29 title VARCHAR(160) not null
- vNext now: V/db/schema/projects.ts:31 unbounded TEXT, validator max200 at V/modules/projects/validation.ts:19
- Fix: Set one title limit matching accepted legacy data and UI.

## G2-8-017-073  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectTemplate.java:40-41 template_version INT not null default 1
- vNext now: V/db/schema/projects.ts:36-39,81-120 currentVersion + publishedVersion + version table
- Fix: Map legacy revision count to currentVersion, snapshot version histories separately.

## G2-8-017-075  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectTemplate.java:46-47 published_at LocalDateTime
- vNext now: V/db/schema/projects.ts:26-58 no publishedAt timestamp; publishedVersion only
- Fix: Add publishedAt metadata or compute with trustworthy version publication audit event.

## G2-8-017-076  [P2] GAP  facet F22  effort S
- Legacy: LBE/model/ProjectTemplate.java:49-50 archived_at LocalDateTime
- vNext now: V/db/schema/projects.ts:45-47 archivedAt timestamptz nullable
- Fix: Keep archive timestamp, convert local legacy time in IST.

## G2-8-017-077  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectTemplate.java:52-53 phase VARCHAR(80)
- vNext now: V/modules/projects/validation.ts:113-115 overview.phase max120, template column absent
- Fix: Map phase to blueprint and match max length/display.

## G2-8-017-079  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectTemplate.java:67-68 created_by nullable INTEGER
- vNext now: V/db/schema/projects.ts:40-44 createdByUserId UUID NOT NULL FK restrict
- Fix: Map legacy nullable creator to stable system actor or backfill referenced user before import.

## G2-8-017-081  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectTemplate.java:92-97 @Version nullable Long for optimistic JPA locking
- vNext now: V/db/schema/projects.ts:36-39; V/modules/projects/template-service.ts:317-340 int currentVersion CAS + lock
- Fix: Separate editing revision token from template content version when preserving JPA update semantics.

## G2-8-017-082  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/BaseModel.java:28-37 createdAt/updatedAt local timestamps and isDeleted boolean default false
- vNext now: V/db/schema/projects.ts:48-57,33-35 tz-aware timestamps, no isDeleted flag, status ARCHIVED
- Fix: Preserve old soft-delete and time-zone semantics through explicit conversion.
