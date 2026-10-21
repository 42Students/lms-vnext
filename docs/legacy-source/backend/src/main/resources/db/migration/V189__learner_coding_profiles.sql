-- A student's coding-platform profiles (LeetCode, HackerRank, CodeChef, Codeforces, GeeksforGeeks, HackerEarth), kept as
-- {"LEETCODE": "username", ...}. Usernames, not links: the link is built from the platform, so one typo cannot point a
-- recruiter at someone else's site. See CodingPlatforms.
ALTER TABLE learner
    ADD COLUMN coding_profiles JSON NULL COMMENT 'Coding-platform usernames by platform key (CodingPlatforms)';
