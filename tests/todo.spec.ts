import { test } from '../fixtures/base';

test.describe('TodoMVC Tests @smoke', () => {
  test('add, complete and delete todos', async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.addTodo('Buy Groceries');
    await todoPage.addTodo('Pay Bills');
    await todoPage.expectTodos(['Buy Groceries', 'Pay Bills']);

    await todoPage.completeTodo('Buy Groceries');
    await todoPage.expectTodoCompleted('Buy Groceries');

    await todoPage.deleteTodo('Pay Bills');
    await todoPage.expectTodos(['Buy Groceries']);
  });
});
