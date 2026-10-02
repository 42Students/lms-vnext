# LMS vNext color parity map

## Source of truth

vNext color tokens were extracted from the active legacy production branch:

- repository: `42Students/lms2-fe`
- branch: `prod-2026`
- inspected commit: `8881715c9092b9041f5a861f93ab1f686b536e91`
- canonical source: `src/styles/components/_variables.scss`
- supporting source: `src/styles/layouts/sidenav.scss`
- supporting audit: `COLOR_AUDIT.md`

The canonical SCSS token file is authoritative over stray hardcoded colors or third-party defaults that the legacy audit already identifies as inconsistencies.

## Canonical brand

| vNext token | Legacy token | Exact value | Primary use |
| --- | --- | --- | --- |
| `--lms-primary` | `$clrThird` | `#26bac7` | buttons, links, active states, icons |
| `--lms-primary-hover` | `$teal-dark` | `#1e9aa8` | hover/pressed |
| `--lms-primary-text` | `$teal-text` | `#1a95a1` | teal text on white |
| `--lms-primary-subtle` | `$teal-subtle` | `#eff8fa` | tinted surfaces/hover |
| `--lms-primary-light` | `$light-cyan` | `#9ee4e8` | chips/progress/logo accent |
| `--lms-brand-dark` | `$clrSecond` | `#1e363f` | legacy dark teal surfaces |

## Canonical neutrals

| vNext token | Exact value | Use |
| --- | --- | --- |
| `--lms-neutral-900` | `#1a1d21` | headings / primary text |
| `--lms-neutral-700` | `#54505d` | body / secondary text |
| `--lms-neutral-500` | `#6b7280` | muted / captions |
| `--lms-neutral-400` | `#a9a7ae` | placeholders / disabled |
| `--lms-neutral-300` | `#d6dbe3` | subtle separators |
| `--lms-neutral-200` | `#e5e9f0` | borders / dividers |
| `--lms-neutral-100` | `#f1f4f9` | page background |
| `--lms-neutral-50` | `#fafbfc` | subtle card surface |
| `--lms-white` | `#ffffff` | primary surfaces |

## Semantic colors

| vNext token | Legacy token | Exact value |
| --- | --- | --- |
| `--lms-success` | `$status-success` | `#059669` |
| `--lms-warning` | `$status-warning` | `#d97706` |
| `--lms-error` | `$status-error` | `#ef4444` |
| `--lms-info` | `$status-info` | `#26bac7` |
| `--lms-icon-amber` | `$icon-amber` | `#ed9c2c` |
| `--lms-icon-purple` | `$icon-purple` | `#9c6bcc` |
| `--lms-icon-green` | `$icon-green` | `#059669` |

## Navigation/shell treatment

The legacy sidebar source establishes these exact mechanics:

- sidebar surface: `#ffffff`
- sidebar border: `#f1f4f9`
- default navigation text: `#54505d`
- active/hover text: `#26bac7`
- active background: `rgba(38, 186, 199, 0.15)`
- active indicator border: `#26bac7`

These are the starting values for the vNext authenticated shell. Layout may be improved; palette identity may not be replaced.

## Scoped premium accents

The current legacy token file also defines module-scoped elevated accents:

- deep ink: `#0b1220`, `#131c2e`, `#1e293b`
- deep teal: `#0e7c87`
- restrained gold: `#a16207`
- gold subtle: `#fef6e7`

These are available in vNext but must not replace the main teal/white system globally. Use them only where an equivalent scoped module genuinely needs them.

## Colors intentionally not promoted to vNext system tokens

The legacy color audit documents third-party/default or historical values such as Ant Design blue `#1890ff`, Ant red `#ff4d4f`, random Material avatar palettes, and multiple one-off teal shades. Those are not the canonical LMS system and must not be introduced into vNext merely to reproduce old inconsistency.

## Implementation rule

All product UI should consume semantic vNext tokens. A new raw color requires a documented reason and parity review. shadcn/Tailwind defaults are structural conveniences only; they are not permission to replace the LMS palette.
