/**
 * Avatar Service
 * Manages avatar selection and retrieval based on user gender
 * Avatar images are located in src/assets/profile/{gender}/ folder
 */

// Import all avatar images - Male
import maleDefault from '../assets/profile/male/default_male.jpg';
import male1 from '../assets/profile/male/avatar1_male.jpg';
import male3 from '../assets/profile/male/avater3_male.jpg';
import male4 from '../assets/profile/male/avater4_male.jpg';
import male5 from '../assets/profile/male/avater5_male.jpg';
import male10 from '../assets/profile/male/avater10_male.jpg';

// Import all avatar images - Female
import femaleDefault from '../assets/profile/female/default_female.jpg';
import female2 from '../assets/profile/female/avatar2_female.jpg';
import female6 from '../assets/profile/female/avatar6_female.jpg';
import female7 from '../assets/profile/female/avater7_female.jpg';
import female8 from '../assets/profile/female/avater8_female.jpg';
import female9 from '../assets/profile/female/avater9_female.jpg';

/**
 * Get default avatar based on gender
 * @param {string} gender - 'male' or 'female'
 * @returns {string} Avatar image URL/path
 */
export const getDefaultAvatar = (gender) => {
  if (gender === 'male') return maleDefault;
  if (gender === 'female') return femaleDefault;
  return maleDefault; // fallback
};

/**
 * Get all selectable avatars based on gender
 * @param {string} gender - 'male' or 'female'
 * @returns {Array} Array of avatar objects with { id, image, name }
 */
export const getSelectableAvatars = (gender) => {
  const maleAvatars = [
    { id: 'male_1', image: male1, name: 'Avatar 1' },
    { id: 'male_3', image: male3, name: 'Avatar 2' },
    { id: 'male_4', image: male4, name: 'Avatar 3' },
    { id: 'male_5', image: male5, name: 'Avatar 4' },
    { id: 'male_10', image: male10, name: 'Avatar 5' },
  ];

  const femaleAvatars = [
    { id: 'female_2', image: female2, name: 'Avatar 1' },
    { id: 'female_6', image: female6, name: 'Avatar 2' },
    { id: 'female_7', image: female7, name: 'Avatar 3' },
    { id: 'female_8', image: female8, name: 'Avatar 4' },
    { id: 'female_9', image: female9, name: 'Avatar 5' },
  ];

  if (gender === 'male') return maleAvatars;
  if (gender === 'female') return femaleAvatars;
  return maleAvatars; // fallback
};

/**
 * Get avatar by ID
 * @param {string} avatarId - Avatar identifier (e.g., 'male_1', 'female_3')
 * @returns {string} Avatar image URL/path
 */
export const getAvatarById = (avatarId) => {
  const allAvatars = {
    male_default: maleDefault,
    female_default: femaleDefault,
    male_1: male1,
    male_3: male3,
    male_4: male4,
    male_5: male5,
    male_10: male10,
    female_2: female2,
    female_6: female6,
    female_7: female7,
    female_8: female8,
    female_9: female9,
  };

  return allAvatars[avatarId] || getDefaultAvatar('male');
};

/**
 * Get gender symbol
 * @param {string} gender - 'male' or 'female'
 * @returns {string} Gender symbol emoji
 */
export const getGenderSymbol = (gender) => {
  if (gender === 'male') return '♂️';
  if (gender === 'female') return '♀️';
  return '';
};
