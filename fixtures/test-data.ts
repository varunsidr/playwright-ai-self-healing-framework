// Centralized test data (Selenium equivalent: data POJOs/JSON test-data files).
// Specs should reference shared values here instead of duplicating them.
import type {
  InputsPageValues,
  HomePageValues,
  RegisterPageValues,
} from '../pages/practice-site-pages';

export const validInputsData: InputsPageValues = {
  number: '42',
  text: 'Playwright demo',
  password: 'secret',
  date: '2026-08-25',
};

export const homePageData: HomePageValues = {
  demoName: 'Web inputs',
};

// Only number/text populated to verify output for untouched fields.
export const partialInputsData: InputsPageValues = {
  number: '5',
  text: 'Solo field',
  password: '',
  date: '',
};

export const registerData: RegisterPageValues = {
  username: 'jhon@gmail.com',
  password: 'P@ssw0rd2026',
  confirmPassword: 'P@ssw0rd2026',
};

export interface ReviewTestData {
  name: string;
  rating: number;
  comment: string;
}

const firstNames = ['Avery', 'Jordan', 'Morgan', 'Taylor', 'Casey'];
const lastNames = ['Reed', 'Shah', 'Morgan', 'Patel', 'Lane'];
const reviewComments = [
  'The fabric feels comfortable and the fit matched the product details.',
  'The finish looks great and the item arrived in good condition.',
  'The sizing was as expected and the material feels well made.',
  'A comfortable piece with careful stitching and a clean finish.',
  'The product matched the description and feels good to wear.',
];

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export function createReviewTestData(seed: string): ReviewTestData {
  const random = createRandom(seed);
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)];

  return {
    name: `${pick(firstNames)} ${pick(lastNames)}`,
    rating: Math.floor(random() * 5) + 1,
    comment: pick(reviewComments),
  };
}
