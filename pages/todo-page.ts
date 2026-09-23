import { expect, type Locator, type Page } from '@playwright/test';

export class TodoPage {
  private readonly newTodo: Locator;
  private readonly todoItems: Locator;

  constructor(private readonly page: Page) {
    this.newTodo = page.getByPlaceholder('What needs to be done?');
    this.todoItems = page.getByTestId('todo-item');
  }

  async goto() {
    await this.page.goto('https://todomvc.com/examples/react/dist/');
  }

  async addTodo(title: string) {
    await this.newTodo.fill(title);
    await this.newTodo.press('Enter');
  }

  async completeTodo(title: string) {
    const item = this.todoItems.filter({ hasText: title });
    await item.locator('.toggle').check();
  }

  async deleteTodo(title: string) {
    const item = this.todoItems.filter({ hasText: title });
    await item.hover();
    await item.locator('.destroy').click();
  }

  async expectTodos(titles: string[]) {
    await expect(this.todoItems).toHaveCount(titles.length);
    await expect(this.todoItems).toHaveText(titles);
  }

  async expectTodoCompleted(title: string) {
    await expect(this.todoItems.filter({ hasText: title })).toHaveClass(/completed/);
  }
}
