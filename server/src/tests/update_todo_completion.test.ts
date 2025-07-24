
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoCompletionInput } from '../schema';
import { updateTodoCompletion } from '../handlers/update_todo_completion';
import { eq } from 'drizzle-orm';

describe('updateTodoCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const testTodo = createResult[0];

    const input: UpdateTodoCompletionInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(input);

    // Verify the updated todo
    expect(result.id).toEqual(testTodo.id);
    expect(result.text).toEqual('Test todo');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status to false', async () => {
    // Create a test todo that is already completed
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Completed todo',
        completed: true
      })
      .returning()
      .execute();

    const testTodo = createResult[0];

    const input: UpdateTodoCompletionInput = {
      id: testTodo.id,
      completed: false
    };

    const result = await updateTodoCompletion(input);

    // Verify the updated todo
    expect(result.id).toEqual(testTodo.id);
    expect(result.text).toEqual('Completed todo');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated completion status to database', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Database test todo',
        completed: false
      })
      .returning()
      .execute();

    const testTodo = createResult[0];

    const input: UpdateTodoCompletionInput = {
      id: testTodo.id,
      completed: true
    };

    await updateTodoCompletion(input);

    // Verify the change was persisted in the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].text).toEqual('Database test todo');
  });

  it('should throw error for non-existent todo', async () => {
    const input: UpdateTodoCompletionInput = {
      id: 999, // Non-existent ID
      completed: true
    };

    await expect(updateTodoCompletion(input)).rejects.toThrow(/not found/i);
  });

  it('should preserve original text and creation date', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Original text',
        completed: false
      })
      .returning()
      .execute();

    const testTodo = createResult[0];
    const originalCreatedAt = testTodo.created_at;

    const input: UpdateTodoCompletionInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(input);

    // Verify only completion status changed
    expect(result.text).toEqual('Original text');
    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.completed).toEqual(true);
  });
});
