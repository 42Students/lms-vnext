/**
 * Per-address, per-minute ceilings for the sign-in endpoints. These are coarse backstops against floods, not the
 * defence against guessing: that is the per-contact send budget and the per-challenge verification budget in the
 * database (login-service.ts). A college campus shares one public address, so a ceiling of 10 per minute would lock
 * a whole college out at the start of a lecture.
 */
export const LOGIN_START_PER_IP_PER_MINUTE = 240;
export const LOGIN_VERIFY_PER_IP_PER_MINUTE = 300;
export const LOGIN_EMAIL_PER_IP_PER_MINUTE = 120;
export const LOGIN_ROLL_NUMBER_PER_IP_PER_MINUTE = 120;
