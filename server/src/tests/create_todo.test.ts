
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTodoInput = {
  text: 'Test todo item'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.text).toEqual('Test todo item');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].text).toEqual('Test todo item');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple todos independently', async () => {
    const firstTodo = await createTodo({ text: 'First todo' });
    const secondTodo = await createTodo({ text: 'Second todo' });

    // Verify they have different IDs
    expect(firstTodo.id).not.toEqual(secondTodo.id);
    expect(firstTodo.text).toEqual('First todo');
    expect(secondTodo.text).toEqual('Second todo');

    // Verify both are in database
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(2);
    expect(allTodos.some(todo => todo.text === 'First todo')).toBe(true);
    expect(allTodos.some(todo => todo.text === 'Second todo')).toBe(true);
  });

  it('should set completed to false by default', async () => {
    const result = await createTodo(testInput);

    expect(result.completed).toEqual(false);

    // Verify in database as well
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].completed).toEqual(false);
  });

  it('should handle special characters in text', async () => {
    const specialInput: CreateTodoInput = {
      text: 'Todo with special chars: @#$%^&*()!?'
    };

    const result = await createTodo(specialInput);

    expect(result.text).toEqual('Todo with special chars: @#$%^&*()!?');

    // Verify it's stored correctly in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].text).toEqual('Todo with special chars: @#$%^&*()!?');
  });
});
