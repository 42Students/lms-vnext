/**
 * URL Validation Utility
 * Provides strict validation for URLs entered in profile sections
 */

/**
 * Validates if a string is a valid URL format
 * @param {string} url - The URL string to validate
 * @returns {boolean} - True if valid URL format, false otherwise
 */
export const isValidUrlFormat = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Trim whitespace
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  try {
    // Try to create a URL object - this validates the format
    const urlObj = new URL(trimmedUrl);
    // Ensure it has http or https protocol
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    // If URL constructor throws, try adding https:// prefix
    try {
      const urlWithProtocol = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') 
        ? trimmedUrl 
        : `https://${trimmedUrl}`;
      const urlObj = new URL(urlWithProtocol);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e2) {
      return false;
    }
  }
};

/**
 * Domain validation rules for specific URL types
 */
const DOMAIN_RULES = {
  linkedin: {
    domains: ['linkedin.com', 'www.linkedin.com'],
    message: 'LinkedIn URL must be from linkedin.com domain'
  },
  github: {
    domains: ['github.com', 'www.github.com'],
    message: 'GitHub URL must be from github.com domain'
  },
  twitter: {
    domains: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
    message: 'Twitter URL must be from twitter.com or x.com domain'
  },
  googleScholar: {
    domains: ['scholar.google.com', 'scholar.google.co.in', 'scholar.google.co.uk'],
    message: 'Google Scholar URL must be from scholar.google.com domain'
  },
  researchGate: {
    domains: ['researchgate.net', 'www.researchgate.net'],
    message: 'ResearchGate URL must be from researchgate.net domain'
  }
};

/**
 * Validates if URL belongs to expected domain(s)
 * @param {string} url - The URL string to validate
 * @param {string} type - The type of URL (linkedin, github, twitter, etc.)
 * @returns {{isValid: boolean, message: string}} - Validation result
 */
export const validateUrlDomain = (url, type) => {
  if (!url || !type) {
    return { isValid: true, message: '' }; // Empty URLs are allowed (optional fields)
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { isValid: true, message: '' }; // Empty is valid for optional fields
  }

  // First check if it's a valid URL format
  if (!isValidUrlFormat(trimmedUrl)) {
    return { isValid: false, message: 'Please enter a valid URL (must start with http:// or https://)' };
  }

  // Get domain rules for this type
  const rule = DOMAIN_RULES[type.toLowerCase()];
  if (!rule) {
    // No specific domain rule, just validate format
    return { isValid: true, message: '' };
  }

  try {
    // Normalize URL (add protocol if missing)
    let normalizedUrl = trimmedUrl;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if hostname matches any of the expected domains
    const matchesDomain = rule.domains.some(domain => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });

    if (!matchesDomain) {
      return { isValid: false, message: rule.message };
    }

    return { isValid: true, message: '' };
  } catch (e) {
    return { isValid: false, message: 'Invalid URL format' };
  }
};

/**
 * Validates a generic URL (for portfolio, live URLs, certificate links, etc.)
 * @param {string} url - The URL string to validate
 * @returns {{isValid: boolean, message: string}} - Validation result
 */
export const validateGenericUrl = (url) => {
  if (!url || !url.trim()) {
    return { isValid: true, message: '' }; // Empty is valid for optional fields
  }

  if (!isValidUrlFormat(url)) {
    return { isValid: false, message: 'Please enter a valid URL (must start with http:// or https://)' };
  }

  return { isValid: true, message: '' };
};

/**
 * Normalizes URL by adding https:// if protocol is missing
 * @param {string} url - The URL to normalize
 * @returns {string} - Normalized URL
 */
export const normalizeUrl = (url) => {
  if (!url || !url.trim()) return url;
  
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  return `https://${trimmedUrl}`;
};

/**
 * OAuth redirect allowlist check.
 * Prevents accidental redirects to untrusted origins when backend data is malformed.
 */
export const isSafeOAuthRedirectUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();
    const currentHost =
      typeof window !== "undefined" && window.location?.hostname
        ? window.location.hostname.toLowerCase()
        : null;
    const allowedHosts = new Set([
      "accounts.google.com",
      "oauth2.googleapis.com",
      "localhost",
      "127.0.0.1",
      ...(currentHost ? [currentHost] : []),
    ]);

    const isHttps = protocol === "https:";
    const isLocalHttp = protocol === "http:" && (host === "localhost" || host === "127.0.0.1");
    const isAllowedGoogleSubdomain = host.endsWith(".google.com");

    return (isHttps || isLocalHttp) && (allowedHosts.has(host) || isAllowedGoogleSubdomain);
  } catch (e) {
    return false;
  }
};

