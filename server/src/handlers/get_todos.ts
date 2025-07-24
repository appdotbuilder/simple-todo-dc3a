
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';
import { desc } from 'drizzle-orm';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    const result = await db.select()
      .from(todosTable)
      .orderBy(desc(todosTable.created_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};
