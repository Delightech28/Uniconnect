/**
 * @typedef {'UPLOAD' | 'DASHBOARD' | 'QUIZ_CONFIG' | 'QUIZ_PLAY' | 'QUIZ_REVIEW' | 'CHAT' | 'PODCAST_CONFIG' | 'PODCAST_PLAY'} AppMode
 */
export const AppMode = {
  UPLOAD: 'UPLOAD',
  DASHBOARD: 'DASHBOARD',
  QUIZ_CONFIG: 'QUIZ_CONFIG',
  QUIZ_PLAY: 'QUIZ_PLAY',
  QUIZ_REVIEW: 'QUIZ_REVIEW',
  CHAT: 'CHAT',
  PODCAST_CONFIG: 'PODCAST_CONFIG',
  PODCAST_PLAY: 'PODCAST_PLAY'
};

/**
 * @typedef {Object} UploadedFile
 * @property {string} name - File name
 * @property {string} type - MIME type (application/pdf)
 * @property {string} data - Base64 encoded file data
 */

/**
 * @typedef {Object} QuizSettings
 * @property {number} questionCount - 10-100 questions
 * @property {number} timePerQuestion - 10-60 seconds per question
 * @property {number} totalTimeLimit - 10-90 minutes (0 for unlimited)
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id - Question ID
 * @property {string} text - Question text
 * @property {string[]} options - Answer options
 * @property {number} correctAnswerIndex - Index of correct answer
 * @property {string} explanation - Why answer is correct
 * @property {number} [sourcePage] - PDF page number reference
 * @property {string} [sourceContext] - Text snippet from source
 */

/**
 * @typedef {Object} QuizResult
 * @property {string} questionId - Question ID
 * @property {number} selectedAnswerIndex - User's selected answer (-1 if skipped)
 * @property {boolean} isCorrect - Whether answer was correct
 * @property {number} timeTaken - Time spent on question (seconds)
 */

/**
 * @typedef {'US' | 'UK' | 'NG'} VoiceAccent
 */

/**
 * @typedef {'FUNNY' | 'PROFESSIONAL' | 'TEACHER' | 'FRIEND'} ContentTone
 */

/**
 * @typedef {Object} PodcastSegment
 * @property {number} startTime - Start time in seconds
 * @property {string} topic - Topic of segment
 * @property {string} speaker - Speaker name
 * @property {string} text - Segment text
 */

/**
 * @typedef {Object} PodcastSettings
 * @property {ContentTone} tone - Podcast tone
 * @property {VoiceAccent} accent - Voice accent
 * @property {number} durationMinutes - Duration in minutes
 * @property {'SINGLE' | 'DOUBLE'} speakerCount - Number of speakers
 * @property {string} hostAName - First host name
 * @property {string} [hostBName] - Second host name (if DOUBLE)
 * @property {string[]} selectedTopics - Topics to focus on
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Message ID
 * @property {'user' | 'model'} role - User or AI role
 * @property {string} text - Message text
 * @property {number} timestamp - Timestamp
 * @property {boolean} [isEditing] - Is being edited
 * @property {'like' | 'dislike' | null} [feedback] - User feedback
 * @property {string} [audioData] - Base64 PCM audio
 */

/**
 * @typedef {Object} ChatSessionData
 * @property {string} id - Session ID
 * @property {string} title - Session title
 * @property {ChatMessage[]} messages - Chat messages
 * @property {number} lastModified - Last modified timestamp
 * @property {Object} settings - Session settings
 * @property {VoiceAccent} settings.accent - Voice accent
 * @property {ContentTone} settings.tone - Content tone
 */

/**
 * @typedef {Object} TopicStatus
 * @property {string} name - Topic name
 * @property {boolean} isLocked - Is topic locked
 * @property {number} [bestScore] - Best quiz score for topic
 */
