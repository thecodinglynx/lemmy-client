/**
 * Utility functions for validating Lemmy API parameters
 */

// Max value for i32 (signed 32-bit integer) used by Lemmy for IDs
const MAX_I32 = 2147483647;
const MIN_I32 = -2147483648;

/**
 * Validates if a community ID is within the valid i32 range for Lemmy API
 * @param id The community ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidCommunityId(id: number): boolean {
  return Number.isInteger(id) && id >= MIN_I32 && id <= MAX_I32;
}

/**
 * Validates if a post ID is within the valid i32 range for Lemmy API
 * @param id The post ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidPostId(id: number): boolean {
  return Number.isInteger(id) && id >= MIN_I32 && id <= MAX_I32;
}

/**
 * Validates if a person ID is within the valid i32 range for Lemmy API
 * @param id The person ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidPersonId(id: number): boolean {
  return Number.isInteger(id) && id >= MIN_I32 && id <= MAX_I32;
}

/**
 * Filters an array of communities to only include those with valid IDs
 * @param communities Array of communities to filter
 * @returns Array containing only communities with valid IDs
 */
export function filterValidCommunities<T extends { id: number }>(
  communities: T[]
): T[] {
  return communities.filter((community) => isValidCommunityId(community.id));
}

/**
 * Logs a warning for invalid community IDs
 * @param id The invalid community ID
 * @param context Additional context for the warning
 */
export function logInvalidCommunityId(id: number, context: string = ''): void {
  console.warn(`Invalid community ID ${id} (exceeds i32 limit): ${context}`);
}

/**
 * Sample valid communities for testing the slideshow functionality
 * These are real communities from lemmy.world with confirmed valid IDs
 */
export const SAMPLE_COMMUNITIES = [
  {
    id: 1994,
    name: 'lemmyshitpost',
    title: 'Lemmy Shitpost',
    description: 'Shitpost community',
  },
  {
    id: 1383956,
    name: 'memes',
    title: 'memes',
    description: 'Memes community (valid ID)',
  },
  {
    id: 895,
    name: 'futurama',
    title: 'Futurama',
    description: 'Futurama memes and content',
  },
  {
    id: 4157,
    name: 'reddit',
    title: 'Reddit',
    description: 'Reddit-related content',
  },
  {
    id: 1800,
    name: 'android',
    title: 'Android',
    description: 'Android community',
  },
  {
    id: 8471,
    name: 'egg_irl',
    title: 'Egg IRL',
    description: 'Egg_irl memes',
  },
  {
    id: 2840,
    name: 'world',
    title: 'World News',
    description: 'World news and current events',
  },
] as const;

/**
 * Development helper: Add sample communities for testing
 * You can call this from the browser console to quickly test the slideshow
 */
export function addSampleCommunities() {
  if (typeof window === 'undefined') return;

  // Access the Zustand store from global scope
  // @ts-ignore - This is for development testing only
  const useAppStore = window.useAppStore;
  if (!useAppStore) {
    console.error('App store not found. Make sure the app is loaded.');
    return;
  }

  const addCommunity = useAppStore.getState().addCommunity;
  let added = 0;

  SAMPLE_COMMUNITIES.forEach((community) => {
    try {
      addCommunity(community);
      added++;
      console.log(`Added community: ${community.name} (ID: ${community.id})`);
    } catch (error) {
      console.warn(`Failed to add community ${community.name}:`, error);
    }
  });

  console.log(`Successfully added ${added} sample communities for testing!`);
  console.log('You can now test the slideshow with these communities.');
}

// Make function available globally for development
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.addSampleCommunities = addSampleCommunities;
}
