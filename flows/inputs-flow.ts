import { InputsPage, type InputsPageValues } from '../pages/inputs-page';

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