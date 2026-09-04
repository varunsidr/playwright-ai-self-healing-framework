import { test, expect } from '@playwright/test';

test.describe('TodoMVC Tests @smoke', () => {
  const TODO_URL = 'https://todomvc.com/examples/react/dist/';

  test('add, complete and delete todos', async ({ page }) => {
    await page.goto(TODO_URL);

    const newTodo = page.locator('.new-todo');
    const todoItems = page.locator('.todo-list li');

    // Add two todos
    await newTodo.fill('Buy Groceries');
    await newTodo.press('Enter');
    await newTodo.fill('Pay Bills');
    await newTodo.press('Enter');

    // Assert both todos present
    await expect(todoItems).toHaveCount(2);
    await expect(todoItems.nth(0)).toHaveText('Buy Groceries');
    await expect(todoItems.nth(1)).toHaveText('Pay Bills');

    // Mark first as complete
    await todoItems.nth(0).locator('.toggle').click();
    await expect(todoItems.nth(0)).toHaveClass(/completed/);

    // Delete second todo (destroy button appears on hover)
    await todoItems.nth(1).hover();
    await todoItems.nth(1).locator('.destroy').click({ force: true });

    // Verify only one todo remains and it's the completed one
    await expect(todoItems).toHaveCount(1);
    await expect(todoItems.nth(0)).toHaveText('Buy Groceries');
  });
});
