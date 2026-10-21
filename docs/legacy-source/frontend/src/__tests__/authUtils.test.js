/**
 * Tests for JWT authentication utilities.
 * Verifies token storage, retrieval, and clearing.
 */

import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAllTokens,
  getAndClearSessionReturnPath,
  hasRefreshToken,
  SESSION_RETURN_PATH_KEY,
  storeAuthResponse,
  getStoredUserData,
} from '@/utils/authUtils';

describe('authUtils', () => {
  // Reset state before each test
  beforeEach(() => {
    setAccessToken(null);
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('Access Token (In-Memory)', () => {
    test('setAccessToken and getAccessToken work correctly', () => {
      // Initially null
      expect(getAccessToken()).toBeNull();

      // Set and retrieve
      setAccessToken('test-access-token-123');
      expect(getAccessToken()).toBe('test-access-token-123');

      // Update
      setAccessToken('new-access-token-456');
      expect(getAccessToken()).toBe('new-access-token-456');

      // Clear
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('Refresh Token (localStorage)', () => {
    test('setRefreshToken stores in localStorage', () => {
      // Set refresh token
      setRefreshToken('test-refresh-token-abc');

      // Verify localStorage.setItem was called
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'lms_refresh_token',
        'test-refresh-token-abc'
      );

      // Verify getRefreshToken retrieves it
      localStorage.getItem.mockReturnValue('test-refresh-token-abc');
      expect(getRefreshToken()).toBe('test-refresh-token-abc');
    });

    test('hasRefreshToken returns correct boolean', () => {
      // No refresh token
      localStorage.getItem.mockReturnValue(null);
      expect(hasRefreshToken()).toBe(false);

      // With refresh token
      localStorage.getItem.mockReturnValue('some-token');
      expect(hasRefreshToken()).toBe(true);
    });
  });

  describe('clearAllTokens', () => {
    test('clears everything (access token and localStorage)', () => {
      // Setup - set some values
      setAccessToken('access-token');
      setRefreshToken('refresh-token');

      // Clear all
      clearAllTokens();

      // Verify access token is cleared (in-memory)
      expect(getAccessToken()).toBeNull();

      // Verify localStorage.removeItem was called for all keys
      expect(localStorage.removeItem).toHaveBeenCalledWith('lms_refresh_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userData');
      expect(localStorage.removeItem).toHaveBeenCalledWith('isUserLoggedIn');
    });
  });

  describe('Session expiry return context', () => {
    test('returns a recent internal page including query and hash exactly once', () => {
      const path = '/learn/projects?status=active#deliverables';
      sessionStorage.setItem(SESSION_RETURN_PATH_KEY, JSON.stringify({ path, at: Date.now() })
      );

      expect(getAndClearSessionReturnPath()).toBe(path);
      expect(sessionStorage.getItem(SESSION_RETURN_PATH_KEY)).toBeNull();
      expect(getAndClearSessionReturnPath()).toBeNull();
    });

    test('rejects external or protocol-relative redirect targets', () => {
      sessionStorage.setItem(SESSION_RETURN_PATH_KEY, JSON.stringify({ path: '//evil.example/steal', at: Date.now() })
      );
      expect(getAndClearSessionReturnPath()).toBeNull();

      sessionStorage.setItem(SESSION_RETURN_PATH_KEY, JSON.stringify({ path: 'https://evil.example/steal', at: Date.now() })
      );
      expect(getAndClearSessionReturnPath()).toBeNull();
    });

    test('rejects stale return context', () => {
      sessionStorage.setItem(SESSION_RETURN_PATH_KEY, JSON.stringify({
          path: '/teacher/courses/42',
          at: Date.now() - (31 * 60 * 1000),
        })
      );

      expect(getAndClearSessionReturnPath()).toBeNull();
    });
  });

  describe('storeAuthResponse', () => {
    test('stores tokens and returns user', () => {
      const authResponse = {
        user: { id: 42, userType: 'LEARNER', firstName: 'Test' },
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-xyz',
        expiresIn: 900,
      };

      // Store auth response
      const user = storeAuthResponse(authResponse);

      // Verify user is returned
      expect(user).toEqual(authResponse.user);

      // Verify access token is stored in memory
      expect(getAccessToken()).toBe('access-token-xyz');

      // Verify refresh token stored in localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'lms_refresh_token',
        'refresh-token-xyz'
      );

      // Verify user data stored in localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'userData',
        JSON.stringify(authResponse.user)
      );

      // Verify isUserLoggedIn flag
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'isUserLoggedIn',
        'true'
      );
    });

    test('handles wrapped response (Response DTO)', () => {
      // Backend may wrap response in { data: { user, accessToken, ... } }
      const wrappedResponse = {
        data: {
          user: { id: 1, userType: 'FACULTY' },
          accessToken: 'wrapped-access',
          refreshToken: 'wrapped-refresh',
        },
      };

      const user = storeAuthResponse(wrappedResponse);

      // Should unwrap and return user
      expect(user).toEqual({ id: 1, userType: 'FACULTY' });
      expect(getAccessToken()).toBe('wrapped-access');
    });

    test('returns null for null/undefined input', () => {
      expect(storeAuthResponse(null)).toBeNull();
      expect(storeAuthResponse(undefined)).toBeNull();
    });
  });

  describe('getStoredUserData', () => {
    test('returns parsed user data from localStorage', () => {
      const userData = { id: 1, userType: 'LEARNER' };
      localStorage.getItem.mockReturnValue(JSON.stringify(userData));

      expect(getStoredUserData()).toEqual(userData);
    });

    test('returns null if no user data', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(getStoredUserData()).toBeNull();
    });

    test('returns null for invalid JSON', () => {
      localStorage.getItem.mockReturnValue('not-valid-json');
      expect(getStoredUserData()).toBeNull();
    });
  });
});
