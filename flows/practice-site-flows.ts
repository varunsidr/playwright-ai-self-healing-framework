// Scenario-level orchestration above the practice-site page objects --
// grouped in one file since each flow is a thin wrapper for a small page.
// Only add a flow class when a scenario spans multiple page objects or a
// multi-step sequence is reused across specs (see ARCHITECTURE.md notes).
import { HomePage } from '../pages/practice-site-pages';
import { InputsPage, type InputsPageValues } from '../pages/practice-site-pages';
import { RegisterPage, type RegisterPageValues } from '../pages/practice-site-pages';

export class HomeFlow {
  constructor(private readonly homePage: HomePage) {}

  async open() {
    await this.homePage.goto();
  }

  async openDemo(demoName: string) {
    await this.homePage.openDemo(demoName);
  }

  async searchForExample(term: string) {
    await this.homePage.searchForExample(term);
  }
}

export class InputsFlow {
  constructor(private readonly inputsPage: InputsPage) {}

  async open() {
    await this.inputsPage.goto();
  }

  async fillAndDisplay(values: InputsPageValues) {
    await this.inputsPage.fill(values);
    await this.inputsPage.display();
  }

  async clear() {
    await this.inputsPage.clear();
  }
}

export class RegisterFlow {
  constructor(
    private readonly homePage: HomePage,
    private readonly registerPage: RegisterPage,
  ) {}

  // Mirrors the real user path: homepage -> "Try it out" link on the
  // "Test Register Page" card -> /register (rather than a direct goto).
  async openViaHomepage() {
    await this.homePage.goto();
    await this.homePage.openRegisterDemo();
  }

  async fillAndSubmit(values: RegisterPageValues) {
    await this.registerPage.fill(values);
    await this.registerPage.submit();
  }
}
