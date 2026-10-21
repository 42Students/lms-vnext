# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/organization.md

11 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/organization.md

## G2-6-018-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy fetchById includes full Organization including isDeleted (OrganizationController.java:99-110).
- vNext now: vNext loadActiveOrganization projects id/name active only (organizations/service.ts:42-64).
- Fix: Expose archived metadata only through authorized archived register; explain deliberate core DTO simplification.

## G2-6-018-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy table columns Name, Status, Actions with status width100/actions width210 (Organizations.js:148-165).
- vNext now: vNext actions dropdown Rename/Archive, no direct two row buttons (organization-actions.tsx:104-111).
- Fix: Preserve columns/order/width and expose equivalent accessible row actions.

## G2-6-018-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy unsaved create/edit form guard (Organizations.js:30-31).
- vNext now: vNext create form uses draft persistence (organization-create-form.tsx:17-19), rename close unguarded (organization-actions.tsx:113-116).
- Fix: Restore navigation guard for unsaved edits; decide intended create draft restore semantics.

## G2-6-018-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy Edit “name” modal, Save Changes and Cancel, maskClosable false (Organizations.js:208-216).
- vNext now: vNext Rename organization dialog with Save name and Cancel (organization-actions.tsx:113-139).
- Fix: Clone exact modal title, labels, close behavior and button copy.

## G2-6-018-031  [P2] GAP  facet F09  effort S
- Legacy: Legacy Delete “X”? popconfirm with college dependency warning (Organizations.js:155-160).
- vNext now: vNext Archive X? confirm dialog with different explanation (organization-actions.tsx:160-168).
- Fix: Preserve correct meaning while matching old modal spacing/copy where legacy delete is user-visible.

## G2-6-018-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy delete soft sets isDeleted TRUE (OrganizationServiceImpl.java:72-87).
- vNext now: vNext sets status ARCHIVED and records activity (organizations/service.ts:245-268).
- Fix: Map legacy delete to archive semantics and ensure archived org cannot participate in new college creation.

## G2-6-018-048  [P2] GAP  facet F17  effort S
- Legacy: Legacy Edit/Delete aria-label includes organization name (Organizations.js:154-160).
- vNext now: vNext Actions dropdown generic Organization actions; Rename/Archive items (organization-actions.tsx:104-111).
- Fix: Add per-row contextual accessible label and confirmation focus restoration.

## G2-6-018-049  [P2] GAP  facet F17  effort M
- Legacy: Legacy has unsaved edit modal maskClosable false (Organizations.js:208-216).
- vNext now: vNext Dialog dismissible when not pending (organization-actions.tsx:113-116).
- Fix: Prevent inadvertent Escape/backdrop dismissal with dirty edits; restore focus to Actions.

## G2-6-018-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy button label Edit/Delete and modal Edit “X” Save Changes (Organizations.js:154-160,208-215).
- vNext now: vNext Rename/Archive and Rename organization Save name (organization-actions.tsx:104-139).
- Fix: Restore exact copy where action semantics equivalent; otherwise document intentional rename/archive terminology.

## G2-6-018-057  [P2] GAP  facet F22  effort M
- Legacy: Legacy organization single table with inherited integer PK, nullable name, timestamps and is_deleted (Organization.java:10-17; BaseModel.java:22-37).
- vNext now: vNext organizations UUID PK, NOT NULL name, status ENUM, timestamps (organizations.ts:5-13).
- Fix: Maintain explicit column-by-column schema mapping and archived/deleted parity.

## G2-6-018-051  [P3] GAP  facet F18  effort S
- Legacy: Legacy create card Organization Name (capital N), placeholder e.g., ABC University (Organizations.js:170-175).
- vNext now: vNext Organization name (lowercase n), same placeholder (organization-create-form.tsx:64-77).
- Fix: Match label capitalization Organization Name.
