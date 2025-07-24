
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load todos on component mount
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Handle creating new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    setIsSubmitting(true);
    try {
      const input: CreateTodoInput = { text: newTodoText.trim() };
      const newTodo = await trpc.createTodo.mutate(input);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setNewTodoText('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling todo completion
  const handleToggleCompletion = async (todoId: number, completed: boolean) => {
    try {
      const updatedTodo = await trpc.updateTodoCompletion.mutate({
        id: todoId,
        completed
      });
      
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === todoId ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  // Split todos into completed and incomplete
  const incompleteTodos = todos.filter((todo: Todo) => !todo.completed);
  const completedTodos = todos.filter((todo: Todo) => todo.completed);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2">✓ Todo</h1>
          <p className="text-gray-500">Simple. Clean. Effective.</p>
        </div>

        {/* Add new todo form */}
        <Card className="p-6 mb-8 shadow-sm">
          <form onSubmit={handleCreateTodo} className="flex gap-3">
            <Input
              value={newTodoText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTodoText(e.target.value)
              }
              placeholder="What needs to be done?"
              className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              disabled={isSubmitting || !newTodoText.trim()}
              className="bg-blue-500 hover:bg-blue-600 px-6"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </form>
        </Card>

        {/* Loading state */}
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            Loading todos...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Incomplete todos */}
            {incompleteTodos.length > 0 && (
              <Card className="p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-700 mb-4">
                  To Do ({incompleteTodos.length})
                </h2>
                <div className="space-y-3">
                  {incompleteTodos.map((todo: Todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 group hover:bg-gray-50 p-2 rounded-md transition-colors"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={(checked: boolean) =>
                          handleToggleCompletion(todo.id, checked)
                        }
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className="flex-1 text-gray-800">{todo.text}</span>
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {todo.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Completed todos */}
            {completedTodos.length > 0 && (
              <Card className="p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-700 mb-4">
                  Completed ({completedTodos.length})
                </h2>
                <div className="space-y-3">
                  {completedTodos.map((todo: Todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 group hover:bg-gray-50 p-2 rounded-md transition-colors"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={(checked: boolean) =>
                          handleToggleCompletion(todo.id, checked)
                        }
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className="flex-1 text-gray-500 line-through">
                        {todo.text}
                      </span>
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {todo.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Empty state */}
            {todos.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  No todos yet
                </h3>
                <p className="text-gray-400">
                  Add your first todo above to get started!
                </p>
                </div>
            )}

            {/* Summary */}
            {todos.length > 0 && (
              <div className="text-center text-sm text-gray-400 pt-4">
                {incompleteTodos.length} remaining • {completedTodos.length} completed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
