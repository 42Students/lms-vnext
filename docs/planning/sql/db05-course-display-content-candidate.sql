-- W02 DB05 SOURCE-ONLY CANDIDATE. W01 must allocate/register migration.
-- Legacy source: course.contents JSON (MetaData) active consumers:
-- introduction_content, html_content/htmlContent, takeaways, thumbnail/image.
-- Deliberately not ported: retired access flags and duplicated fields that are
-- already normalized into Course, Offering, Period or tenant models.

create table if not exists course_display_contents (
  course_id uuid primary key
    references courses(id) on delete cascade,
  introduction_text text null,
  body_html text null,
  takeaways text[] not null default array[]::text[],
  thumbnail_url text null,
  version integer not null default 0,
  updated_by_user_id uuid not null
    references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_display_contents_version_ck
    check (version >= 0),
  constraint course_display_contents_takeaways_count_ck
    check (cardinality(takeaways) <= 30)
);

-- Application validation caps introduction to 500 chars, body to 20k,
-- each takeaway to 500 chars / 30 total, https-only thumbnail URLs, and
-- stores strict sanitized attribute-free HTML.
