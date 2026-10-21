-- Google OAuth (faculty Meet/Calendar connect) and learner Gmail validation were removed from
-- the app entirely; these tables have no remaining entity/repository referencing them.
DROP TABLE IF EXISTS google_oauth_tokens;
DROP TABLE IF EXISTS learner_gmail_validation;
