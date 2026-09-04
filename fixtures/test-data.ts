// Centralized test data (Selenium equivalent: data POJOs/JSON test-data files).
// Specs must reference values from here, never hardcode input literals inline.
import type { InputsPageValues, HomePageValues, RegisterPageValues } from '../pages/practice-site-pages';

export const validInputsData: InputsPageValues = {
  number: '42',
  text: 'Playwright demo',
  password: 'secret',
  date: '2026-08-25',
};

export const homePageData: HomePageValues = {
  demoName: 'Web inputs',
};

// Only number/text populated -- password/date left blank on purpose to
// verify the output panel echoes blanks for untouched fields.
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
