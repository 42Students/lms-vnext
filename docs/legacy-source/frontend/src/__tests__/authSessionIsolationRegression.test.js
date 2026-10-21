/**
 * Worker C: C-AU-02/07/12, C-SH-01/02/03/05, C-X07/10.
 * Frontend LOCAL/MOCKED auth state tests. These do not establish real server
 * authorization, session revocation, tenant isolation or browser acceptance.
 */
import {
  SESSION_EXPIRED_KEY,
  SESSION_EXPIRED_REDIRECT_GUARD_KEY,
  clearAllTokens,
  getAccessToken,
  getAndClearLogoutReason,
  getSessionExpiryRedirectPath,
  getStoredUserData,
  handleSessionExpired,
  initCrossTabLogoutListener,
  initCrossTabOrgSwitchListener,
  refreshAccessToken,
  setAccessToken,
  setRefreshToken,
  storeAuthResponse,
} from '@/utils/authUtils';

const session = (id, collegeId) => ({ id, userType: 'LEARNER', collegeId, organizationId: 3 });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  setAccessToken(null);
  localStorage.clear();
  sessionStorage.clear();
  global.fetch.mockReset();
});
afterEach(() => {
  setAccessToken(null);
  sessionStorage.clear();
  jest.restoreAllMocks();
});

describe('C-AU-02/12: local identity and session hygiene', () => {
  it('clears prior learner, search suggestions and tab-specific state without deleting the expiry reason or redirect guard', () => {
    storeAuthResponse({ user: session(42, 7), accessToken: 'old-access', refreshToken: 'old-refresh' });
    localStorage.setItem('recentFaculty', 'College A faculty');
    localStorage.setItem('recentLearners', 'College A learner');
    localStorage.setItem('recentCourses', '[{"name":"College A course"}]');
    sessionStorage.setItem('selectedProject', 'college-A-project');
    sessionStorage.setItem('lms_tab_id', 'old-tab');
    sessionStorage.setItem(SESSION_EXPIRED_KEY, 'session_expired');
    sessionStorage.setItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY, '1');

    clearAllTokens();

    expect(getAccessToken()).toBeNull();
    for (const key of ['lms_refresh_token', 'userData', 'isUserLoggedIn', 'recentFaculty', 'recentLearners', 'recentCourses']) {
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(getStoredUserData()).toBeNull();
    expect(sessionStorage.getItem('selectedProject')).toBeNull();
    expect(sessionStorage.getItem('lms_tab_id')).toBeNull();
    // An explicit logout drops the expiry reason and redirect guard too: a stale guard would stop the next session in
    // this tab from redirecting when it expires, and a stale reason would show "session expired" after a normal logout.
    expect(sessionStorage.getItem(SESSION_EXPIRED_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY)).toBeNull();
  });

  it('keeps the expiry reason and redirect guard only on the session-expiry path', () => {
    sessionStorage.setItem('selectedProject', 'college-A-project');
    sessionStorage.setItem(SESSION_EXPIRED_KEY, 'session_expired');
    sessionStorage.setItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY, '1');

    clearAllTokens({ preserveSessionExpiryContext: true });

    expect(sessionStorage.getItem('selectedProject')).toBeNull();
    expect(sessionStorage.getItem(SESSION_EXPIRED_KEY)).toBe('session_expired');
    expect(sessionStorage.getItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY)).toBe('1');
  });

  it('stores the new account rather than resurrecting the old account, and clears one-time expiry state on login', () => {
    storeAuthResponse({ user: session(42, 7), accessToken: 'A', refreshToken: 'A-refresh' });
    handleSessionExpired('/learn/projects');
    sessionStorage.setItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY, '1');
    const next = session(42, 8); // deliberately colliding numeric learner ID

    expect(storeAuthResponse({ data: { user: next, accessToken: 'B', refreshToken: 'B-refresh' } })).toEqual(next);
    expect(getAccessToken()).toBe('B');
    expect(getStoredUserData()).toEqual(next);
    expect(localStorage.getItem('lms_refresh_token')).toBe('B-refresh');
    expect(sessionStorage.getItem(SESSION_EXPIRED_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY)).toBeNull();
    expect(getAndClearLogoutReason()).toBeNull();
  });

  it('does not turn a token-only response into a logged-in account', () => {
    expect(storeAuthResponse({ accessToken: 'token-without-user' })).toBeNull();
    expect(getStoredUserData()).toBeNull();
    expect(localStorage.getItem('isUserLoggedIn')).toBeNull();
  });
});

describe('C-AU-07: expired-session navigation and one-time reason', () => {
  it.each([
    ['/learn/courses/42', '/'],
    ['/superadmin/courses', '/superadmin-login'],
    ['/superadmin-login', '/superadmin-login'],
    [undefined, '/'],
    [42, '/'],
  ])('maps %p to %p without carrying a private deep link into the next login', (path, expected) => {
    expect(getSessionExpiryRedirectPath(path)).toBe(expected);
  });

  it('marks a session expired before clearing tokens and consumes the reason once', () => {
    storeAuthResponse({ user: session(1, 7), accessToken: 'A', refreshToken: 'R' });
    sessionStorage.setItem('privateModal', 'College A record');

    expect(handleSessionExpired('/superadmin/colleges/7')).toBe('/superadmin-login');
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('lms_refresh_token')).toBeNull();
    expect(getStoredUserData()).toBeNull();
    expect(sessionStorage.getItem('privateModal')).toBeNull();
    expect(getAndClearLogoutReason()).toBe('session_expired');
    expect(getAndClearLogoutReason()).toBeNull();
  });
});

describe('C-AU-12/C-SH-01: cross-tab identity signals', () => {
  it('clears in-memory access and notifies only on a refresh-token removal event; unsubscribe prevents later effects', () => {
    const onLogout = jest.fn();
    setAccessToken('old-access');
    const unsubscribe = initCrossTabLogoutListener(onLogout);
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', oldValue: 'x', newValue: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'lms_refresh_token', oldValue: null, newValue: 'new-token' }));
    expect(onLogout).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('old-access');

    window.dispatchEvent(new StorageEvent('storage', { key: 'lms_refresh_token', oldValue: 'old-token', newValue: null }));
    expect(getAccessToken()).toBeNull();
    expect(onLogout).toHaveBeenCalledTimes(1);

    unsubscribe();
    setAccessToken('next-access');
    window.dispatchEvent(new StorageEvent('storage', { key: 'lms_refresh_token', oldValue: 'next-token', newValue: null }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('next-access');
  });

  it('notifies an org switch only when its broadcast value changes, and removes its listener', () => {
    const onSwitch = jest.fn();
    const unsubscribe = initCrossTabOrgSwitchListener(onSwitch);
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', oldValue: '1', newValue: '2' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'lms_org_switch_ts', oldValue: '1', newValue: '1' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'lms_org_switch_ts', oldValue: '1', newValue: null }));
    expect(onSwitch).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent('storage', { key: 'lms_org_switch_ts', oldValue: '1', newValue: '2' }));
    expect(onSwitch).toHaveBeenCalledTimes(1);
    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: 'lms_org_switch_ts', oldValue: '2', newValue: '3' }));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });
});

describe('C-SH-02/03/05 and C-X10: bounded mocked refresh behavior', () => {
  it('coalesces concurrent refresh calls into one POST, uses the current refresh token and stores the rotated identity', async () => {
    setRefreshToken('synthetic-initial');
    const response = deferred();
    global.fetch.mockReturnValueOnce(response.promise);

    const first = refreshAccessToken();
    const second = refreshAccessToken();
    response.resolve({ ok: true, json: async () => ({ data: {
      accessToken: 'synthetic-new', refreshToken: 'synthetic-rotated', user: session(51, 8),
    } }) });
    expect(await Promise.all([first, second])).toEqual(['synthetic-new', 'synthetic-new']);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/auth\/refresh$/);
    expect(options).toEqual(expect.objectContaining({
      method: 'POST', credentials: 'include', body: JSON.stringify({ refreshToken: 'synthetic-initial' }),
    }));
    expect(getAccessToken()).toBe('synthetic-new');
    expect(localStorage.getItem('lms_refresh_token')).toBe('synthetic-rotated');
    expect(getStoredUserData()).toEqual(session(51, 8));
    expect(localStorage.getItem('lms_refresh_lock')).toBeNull();
  });

  it('uses cookie refresh without sending a stale refresh-token body when local refresh token is missing', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'cookie-issued' }) });
    await expect(refreshAccessToken()).resolves.toBe('cookie-issued');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/auth\/refresh-cookie$/);
    expect(options.body).toBeUndefined();
    expect(options.credentials).toBe('include');
    expect(getAccessToken()).toBe('cookie-issued');
  });

  it.each([
    [401, 'REFRESH_FAILED'],
    [403, 'NETWORK_ERROR'],
    [429, 'NETWORK_ERROR'],
    [500, 'NETWORK_ERROR'],
  ])('rejects refresh HTTP %i with %s, releases its lock and permits a subsequent independent retry', async (status, error) => {
    setRefreshToken('synthetic-refresh');
    global.fetch.mockResolvedValueOnce({ ok: false, status });
    await expect(refreshAccessToken()).rejects.toThrow(error);
    expect(localStorage.getItem('lms_refresh_lock')).toBeNull();

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'recovered' }) });
    await expect(refreshAccessToken()).resolves.toBe('recovered');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(getAccessToken()).toBe('recovered');
  });

  it('handles a rejected network call without leaking a refresh lock or holding a permanent in-flight promise', async () => {
    global.fetch.mockRejectedValueOnce(new Error('synthetic network failure'));
    await expect(refreshAccessToken()).rejects.toThrow('NETWORK_ERROR');
    expect(localStorage.getItem('lms_refresh_lock')).toBeNull();
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'recovered' }) });
    await expect(refreshAccessToken()).resolves.toBe('recovered');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
