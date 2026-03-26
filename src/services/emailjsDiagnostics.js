/**
 * EmailJS Diagnostics Tool
 * Use this to test if EmailJS is properly configured and emails are being sent
 */

import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const VITE_EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const VITE_EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const ADMIN_EMAIL = 'unispaceinnovationhubltd@gmail.com';

/**
 * Test EmailJS configuration
 */
export const testEmailJSConfig = async () => {
  console.log('=== EmailJS Configuration Diagnostic ===');
  
  const config = {
    VITE_EMAILJS_SERVICE_ID: VITE_EMAILJS_SERVICE_ID || 'NOT SET',
    VITE_EMAILJS_TEMPLATE_ID: VITE_EMAILJS_TEMPLATE_ID || 'NOT SET',
    VITE_EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? '✓ SET' : '✗ NOT SET',
    ADMIN_EMAIL: ADMIN_EMAIL,
  };

  console.table(config);

  if (!VITE_EMAILJS_SERVICE_ID) {
    console.error('❌ VITE_EMAILJS_SERVICE_ID is not set in .env');
    return false;
  }

  if (!VITE_EMAILJS_TEMPLATE_ID) {
    console.error('❌ VITE_EMAILJS_TEMPLATE_ID is not set in .env');
    return false;
  }

  if (!import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
    console.error('❌ VITE_EMAILJS_PUBLIC_KEY is not set in .env');
    return false;
  }

  console.log('✓ All EmailJS configuration values are set');
  return true;
};

/**
 * Send a test verification email to admin
 * This will help verify that EmailJS is working correctly
 */
export const sendTestVerificationEmail = async (testUserEmail = 'test@example.com') => {
  try {
    console.log('📧 Sending test verification email...');

    const testData = {
      to_email: ADMIN_EMAIL,
      user_name: 'Test User',
      user_email: testUserEmail,
      username: 'testuser',
      institution: 'Test University',
      register_as: 'Student',
      created_at: new Date().toLocaleDateString(),
      approve_link: 'https://example.com/verify?token=test_token&action=approve&userId=test123',
      reject_link: 'https://example.com/verify?token=test_token&action=reject&userId=test123',
      year: new Date().getFullYear(),
    };

    console.log('📤 Request payload:', testData);

    const result = await emailjs.send(
      VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID,
      testData
    );

    console.log('✅ Test email sent successfully!');
    console.log('Response:', result);
    return { success: true, message: 'Test email sent to admin', result };
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      text: error.text,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Validate template variables
 * Lists all variables that should be in the EmailJS template configuration
 */
export const getRequiredTemplateVariables = () => {
  return {
    recipient: 'to_email (should be set to admin email)',
    user_info: ['user_name', 'user_email', 'username', 'institution'],
    verification: ['register_as', 'created_at', 'approve_link', 'reject_link'],
    metadata: ['year'],
  };
};

/**
 * Check if template exists and is valid
 * This attempts to send a test email which will fail if the template doesn't exist
 */
export const validateTemplate = async () => {
  console.log('🔍 Validating EmailJS Template...');

  const isConfigValid = await testEmailJSConfig();
  if (!isConfigValid) {
    return { valid: false, error: 'Configuration is invalid' };
  }

  const testResult = await sendTestVerificationEmail();
  if (testResult.success) {
    console.log('✅ Template is valid and working!');
    return { valid: true, message: 'Template is valid' };
  } else {
    console.log('❌ Template validation failed');
    return {
      valid: false,
      error: testResult.error,
      tip: 'Check if template ID exists in EmailJS dashboard and has all required variables configured',
    };
  }
};

export default {
  testEmailJSConfig,
  sendTestVerificationEmail,
  getRequiredTemplateVariables,
  validateTemplate,
};
