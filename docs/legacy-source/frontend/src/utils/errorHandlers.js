import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

/**
 * Checks if an error is a duplicate account error and shows appropriate dialog
 * @param {Error} error - The error object from API call
 * @param {string} accountType - Type of account: "learner", "faculty", "user"
 * @returns {boolean} - Returns true if duplicate error was handled, false otherwise
 */
export const handleDuplicateAccountError = (error, accountType = "account") => {
  const errorMessage = 
    error?.response?.data?.message || 
    error?.message || 
    error?.response?.data?.data?.message ||
    String(error);

  // Check for duplicate account error patterns
  const duplicatePatterns = [
    /already exists/i,
    /duplicate/i,
    /already registered/i,
    /account already/i,
    /email already/i,
    /phone.*already/i,
    /mobile.*already/i,
    /username.*already/i,
  ];

  const isDuplicateError = duplicatePatterns.some(pattern => pattern.test(errorMessage));

  if (isDuplicateError) {
    // Determine account type label
    const accountLabels = {
      learner: "Learner",
      faculty: "Faculty",
      user: "User",
      account: "Account",
    };

    const accountLabel = accountLabels[accountType] || "Account";

    // Show modal dialog
    Modal.error({
      title: `${accountLabel} Already Exists`,
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            {errorMessage}
          </p>
          <p style={{ marginTop: 16, fontWeight: 500, color: "#1890ff" }}>
            Please login with your existing credentials instead of creating a new account.
          </p>
        </div>
      ),
      okText: "Go to Login",
      width: 500,
      onOk: () => {
        // Optionally redirect to login page
        // window.location.href = "/login";
      },
    });

    return true;
  }

  return false;
};

/**
 * Generic error handler that shows appropriate dialogs for different error types
 * @param {Error} error - The error object from API call
 * @param {string} accountType - Type of account
 * @param {Function} onError - Optional callback for non-duplicate errors
 */
export const handleRegistrationError = (error, accountType = "account", onError = null) => {
  // First check for duplicate account errors
  if (handleDuplicateAccountError(error, accountType)) {
    return;
  }

  // Handle other errors
  const errorMessage = 
    error?.response?.data?.message || 
    error?.message || 
    error?.response?.data?.data?.message ||
    "An unexpected error occurred";

  if (onError) {
    onError(errorMessage);
  } else {
    Modal.error({
      title: "Registration Failed",
      content: errorMessage,
      okText: "OK",
    });
  }
};

/**
 * Extracts a user-friendly error message from an API error response
 * @param {Error} error - The error object from API call
 * @param {string} fallbackMessage - Default message if no specific error found
 * @returns {string} - The extracted error message
 */
export const extractErrorMessage = (error, fallbackMessage = "An error occurred. Please try again.") => {
  // Try to extract error message from various response formats
  const message = 
    error?.response?.data?.message ||        // Standard API response: { message: "..." }
    error?.response?.data?.data?.message ||  // Nested: { data: { message: "..." } }
    error?.response?.data?.error ||          // Alternative: { error: "..." }
    error?.message ||                        // Axios error message
    (typeof error === 'string' ? error : null) || // Plain string error
    fallbackMessage;

  return message;
};

/**
 * Handles profile update errors and shows appropriate messages
 * Extracts the actual error message from the API response
 * @param {Error} error - The error object from API call
 * @param {Function} showError - Callback to show error message (e.g., message.error)
 * @param {string} fallbackMessage - Default message if no specific error found
 * @returns {string} - The extracted error message
 */
export const handleProfileError = (error, showError = null, fallbackMessage = "Error updating. Please try again.") => {
  const errorMessage = extractErrorMessage(error, fallbackMessage);
  
  if (showError) {
    showError(errorMessage);
  }
  
  return errorMessage;
};

/**
 * Handles validation errors for profile updates
 * Shows a modal for validation errors with specific field information
 * @param {Error} error - The error object from API call
 * @param {string} sectionName - Name of the profile section (e.g., "Contact", "Video Intro")
 * @returns {boolean} - Returns true if it was a validation error, false otherwise
 */
export const handleValidationError = (error, sectionName = "Profile") => {
  const errorMessage = extractErrorMessage(error, "");
  
  // Known validation error patterns
  const validationPatterns = [
    /must be/i,
    /required/i,
    /cannot be/i,
    /invalid/i,
    /already/i,
    /can only be/i,
    /10 digits/i,
    /10-15 digits/i,
  ];
  
  const isValidationError = validationPatterns.some(pattern => pattern.test(errorMessage));
  
  if (isValidationError && errorMessage) {
    Modal.warning({
      title: `${sectionName} Update Failed`,
      content: (
        <div>
          <p style={{ marginBottom: 8, color: "#ff4d4f" }}>
            {errorMessage}
          </p>
          <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
            Please correct the issue and try again.
          </p>
        </div>
      ),
      okText: "OK",
    });
    return true;
  }
  
  return false;
};
