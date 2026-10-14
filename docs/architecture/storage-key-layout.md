# Storage key layout

## Legacy LMS (bucket `R2_BUCKET_NAME`, publicly served via `R2_PUBLIC_URL`)

Source: `42LMS-BACKEND/.../controller/FileUploadController.java` (`presign`, `uploadFile`) and `utils/PrivateDocStorage.java`.

Key shape: `org-<orgId>/college-<collegeId>/<folder>[/<owner>][/project-<id>]/<random-uuid><ext>`

- Tenant prefix: `org-<orgId>/college-<collegeId>`.
- Allowed folders: `lesson-content`, `profile-images`, `video-intros`, `resumes`, `assignments`, `course-images`, `identity-docs`, `marksheets`, `college-branding`, `offer-letters`, `jd-files`.
- Self-owned folders (`profile-images`, `video-intros`, `resumes`, `identity-docs`, `marksheets`) add an owner segment: `user-<id>`, or `faculty-<id>` for staff in the private folders (`identity-docs`, `marksheets`).
- `assignments` uploads for projects add `project-<id>`; course submissions share the folder.
- `identity-docs` and `marksheets` go to a private bucket (`R2_PRIVATE_BUCKET_NAME`, interim: the main bucket) and are stored as `private-doc:<key>`, opened only via links signed after an access check (5 minute view links, 15 minute presigned PUT).
- Imported lesson videos: `<tenant>/lesson-content/<uuid><ext>`.

## vNext (`src/modules/storage/private-object-storage.ts`)

Logical key (stored in the DB): `private/<college UUID>/<membership UUID>/<namespace>/<object UUID>`.
Namespaces: `profile-verification`, `assignment-submission`, `course-resource`, `project-resource`.

| Legacy folder | vNext namespace |
| --- | --- |
| `identity-docs`, `marksheets` | `profile-verification` |
| `assignments` (course and project submissions) | `assignment-submission` |
| `lesson-content` | `course-resource` |
| project resources | `project-resource` |

Dev bucket sharing: with `R2_PRIVATE_PREFIX=vnext-dev/` (development only) the physical object key is `vnext-dev/private/<college>/<membership>/<namespace>/<uuid>`. The prefix never overlaps with legacy keys, which all start with `org-`. Health-check objects live at `vnext-dev/_healthcheck/<random>.txt`. Never list, overwrite or delete anything outside `vnext-dev/`.
