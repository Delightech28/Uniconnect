/**
 * Input Validation Utilities for UniConnect
 * Provides reusable validation functions for common user inputs
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // Trim whitespace
  email = email.trim().toLowerCase();

  // RFC 5322 simplified email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Check for local part length (before @)
  const [localPart] = email.split('@');
  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long (max 64 characters)' };
  }

  // Check for domain length (after @)
  const [, domain] = email.split('@');
  if (domain.length > 255) {
    return { valid: false, error: 'Email domain is too long (max 255 characters)' };
  }

  return { valid: true, error: null };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error: string|null, strength: 'weak'|'medium'|'strong' }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Password is required', strength: 'weak' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long', strength: 'weak' };
  }

  let strength = 'weak';
  let issues = [];

  // Check for uppercase letters
  if (!/ [A-Z]/.test(password)) {
    issues.push('uppercase letter');
  } else {
    strength = 'medium';
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    issues.push('lowercase letter');
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    issues.push('number');
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('special character');
  }

  if (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    strength = 'strong';
  }

  return { valid: true, error: null, strength };
};

/**
 * Validate display name
 * @param {string} displayName - Display name to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateDisplayName = (displayName) => {
  if (!displayName || typeof displayName !== 'string') {
    return { valid: false, error: 'Display name is required' };
  }

  const trimmed = displayName.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters long' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Display name must be less than 50 characters' };
  }

  // Check for valid characters (alphanumeric, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z0-9\s\-']*$/.test(trimmed)) {
    return { valid: false, error: 'Display name contains invalid characters' };
  }

  return { valid: true, error: null };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username must be less than 30 characters' };
  }

  // Username: alphanumeric, hyphens, underscores only
  if (!/^[a-z0-9_-]*$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }

  // Cannot start with hyphen or underscore
  if (/^[-_]/.test(trimmed)) {
    return { valid: false, error: 'Username cannot start with hyphen or underscore' };
  }

  return { valid: true, error: null };
};

/**
 * Validate bio
 * @param {string} bio - Bio to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateBio = (bio) => {
  if (!bio) {
    return { valid: true, error: null }; // Bio is optional
  }

  if (typeof bio !== 'string') {
    return { valid: false, error: 'Bio must be text' };
  }

  if (bio.length > 500) {
    return { valid: false, error: 'Bio must be less than 500 characters' };
  }

  return { valid: true, error: null };
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeInMB - Maximum file size in MB (default: 5)
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateFileSize = (file, maxSizeInMB = 5) => {
  if (!file) {
    return { valid: true, error: null }; // File is optional
  }

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  if (!file) {
    return { valid: true, error: null }; // File is optional
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate registration form data
 * @param {object} formData - Form data object
 * @returns {object} { valid: boolean, errors: object }
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};

  // Email validation
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  // Password validation
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }

  // Display name validation
  const nameValidation = validateDisplayName(formData.displayName);
  if (!nameValidation.valid) {
    errors.displayName = nameValidation.error;
  }

  // Gender validation (required)
  if (!formData.gender) {
    errors.gender = 'Please select your gender';
  }

  // Institution validation (required for students)
  if (formData.registerAs === 'student' && !formData.institution) {
    errors.institution = 'Please select your institution';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateUsername,
  validateBio,
  validateFileSize,
  validateFileType,
  validateRegistrationForm
};
