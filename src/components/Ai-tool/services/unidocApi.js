/**
 * UniDoc AI Tool API Service
 * Handles all API calls for the Ai-Tool component
 * Uses Firebase as backend with UniDoc API
 */

import { db } from '../../../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const UNIDOC_API_KEY = import.meta.env.VITE_UNIDOC_API_KEY;

/**
 * Make API request to UniDoc API
 * @param {string} prompt - The prompt to send to UniDoc API
 * @returns {Promise<Object>} API response
 */
export const callUnidocAPI = async (prompt) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${UNIDOC_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`UniDoc API Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('UniDoc API Error:', error);
    throw error;
  }
};

/**
 * Save UniDoc request to Firebase
 * @param {Object} requestData - Request data to save
 * @returns {Promise<string>} Document ID
 */
export const saveUnidocRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'unidoc_requests'), {
      ...requestData,
      createdAt: new Date(),
      status: 'processing',
    });
    return docRef.id;
  } catch (error) {
    console.error('Firebase Save Error:', error);
    throw error;
  }
};

/**
 * Update UniDoc request in Firebase
 * @param {string} docId - Document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateUnidocRequest = async (docId, updateData) => {
  try {
    const docRef = doc(db, 'unidoc_requests', docId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Firebase Update Error:', error);
    throw error;
  }
};

/**
 * Solve problem using Gemini API
 * @param {File[]} courseFiles - Course material files
 * @param {File} questionFile - Question file to solve
 * @param {string} userId - User ID for Firebase
 * @returns {Promise<Object>} Solution response
 */
export const solveProblem = async (courseFiles, questionFile, userId) => {
  try {
    // Read file contents
    let courseContent = '';
    if (courseFiles && courseFiles.length > 0) {
      for (const file of courseFiles) {
        const text = await file.text();
        courseContent += `\n--- ${file.name} ---\n${text}`;
      }
    }

    const questionContent = questionFile ? await questionFile.text() : '';

    // Create prompt for Gemini
    const prompt = `You are an expert tutor. Based on the following course materials and question, provide a detailed solution.

COURSE MATERIALS:
${courseContent}

QUESTION:
${questionContent}

Please provide a comprehensive and detailed solution.`;

    // Call UniDoc API
    const unidocResponse = await callUnidocAPI(prompt);

    // Save to Firebase
    const requestId = await saveUnidocRequest({
      type: 'solve',
      userId,
      courseFiles: courseFiles?.map(f => f.name),
      questionFile: questionFile?.name,
      status: 'completed',
      result: unidocResponse,
    });

    return {
      id: requestId,
      response: unidocResponse,
    };
  } catch (error) {
    console.error('Solve Problem Error:', error);
    throw error;
  }
};

/**
 * Generate summary from course materials
 * @param {File[]} files - Files to summarize
 * @param {string} userId - User ID for Firebase
 * @returns {Promise<Object>} Summary response
 */
export const generateSummary = async (files, userId) => {
  try {
    let fileContent = '';
    if (files && files.length > 0) {
      for (const file of files) {
        const text = await file.text();
        fileContent += `\n--- ${file.name} ---\n${text}`;
      }
    }

    const prompt = `You are an expert summarizer. Create a comprehensive but concise summary of the following course materials.

${fileContent}

Please provide key concepts, main points, and important details in a well-organized format.`;

    // Call UniDoc API
    const unidocResponse = await callUnidocAPI(prompt);

    // Save to Firebase
    const requestId = await saveUnidocRequest({
      type: 'summary',
      userId,
      files: files?.map(f => f.name),
      status: 'completed',
      result: unidocResponse,
    });

    return {
      id: requestId,
      response: unidocResponse,
    };
  } catch (error) {
    console.error('Generate Summary Error:', error);
    throw error;
  }
};

/**
 * Review/analyze course materials
 * @param {File[]} files - Files to review
 * @param {string} userId - User ID for Firebase
 * @returns {Promise<Object>} Review response
 */
export const reviewCourse = async (files, userId) => {
  try {
    let fileContent = '';
    if (files && files.length > 0) {
      for (const file of files) {
        const text = await file.text();
        fileContent += `\n--- ${file.name} ---\n${text}`;
      }
    }

    const prompt = `You are an expert academic reviewer. Analyze and review the following course materials. Provide insights on:
- Content quality and accuracy
- Learning objectives
- Key takeaways
- Areas for improvement
- Recommended supplementary materials

${fileContent}

Please provide a thorough and constructive review.`;

    // Call UniDoc API
    const unidocResponse = await callUnidocAPI(prompt);

    // Save to Firebase
    const requestId = await saveUnidocRequest({
      type: 'review',
      userId,
      files: files?.map(f => f.name),
      status: 'completed',
      result: unidocResponse,
    });

    return {
      id: requestId,
      response: unidocResponse,
    };
  } catch (error) {
    console.error('Review Course Error:', error);
    throw error;
  }
};

export default {
  callUnidocAPI,
  saveUnidocRequest,
  updateUnidocRequest,
  solveProblem,
  generateSummary,
  reviewCourse,
};
