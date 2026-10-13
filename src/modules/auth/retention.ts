/**
 * Retention for sign-in data. Login challenges are only needed for their five
 * minute life (and the 10 minute send-rate window); dead sessions are kept a
 * while so a user can still see recent sign-in history.
 */
export const ATTEMPT_RETENTION_DAYS = 1;
export const SESSION_RETENTION_DAYS = 30;

export interface SqlExecutor {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rowCount: number | null }>;
}

export async function purgeAuthData(db: SqlExecutor) {
  const attempts = await db.query(
    `DELETE FROM identity_auth_attempts
      WHERE expires_at < now() - make_interval(days => $1)`,
    [ATTEMPT_RETENTION_DAYS],
  );
  // Expired or revoked, and past the retention window since it stopped working.
  const sessions = await db.query(
    `DELETE FROM identity_device_sessions
      WHERE least(expires_at, coalesce(revoked_at, expires_at))
            < now() - make_interval(days => $1)`,
    [SESSION_RETENTION_DAYS],
  );
  return {
    attemptsDeleted: attempts.rowCount ?? 0,
    sessionsDeleted: sessions.rowCount ?? 0,
  };
}
