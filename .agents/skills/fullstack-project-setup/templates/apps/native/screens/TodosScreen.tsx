import { canCompleteTodo } from "@{{PROJECT_SLUG}}/core";
import { useCreateTodo, useTodos } from "@{{PROJECT_SLUG}}/hooks";
import { useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";

/**
 * Reference example for decision #7. Same `useTodos()` / `useCreateTodo()`
 * hooks as apps/web/src/routes/todos.tsx, called directly from a screen —
 * React Navigation has no route-loader equivalent to React Router's, so
 * there's no adapter here, just the shared hook. Presentation is native UI
 * (FlatList, TextInput) instead of HTML; the data/business logic is
 * byte-for-byte the same code as web.
 *
 * Styling is Tailwind classes via NativeWind (`className`) — decision #15,
 * same class vocabulary as apps/web/src/routes/todos.tsx. No
 * StyleSheet.create / inline style objects for layout (a one-off dynamic
 * value is the exception).
 */
export function TodosScreen() {
  const { data: todos = [], isLoading, error } = useTodos();
  const createTodo = useCreateTodo();
  const [title, setTitle] = useState("");

  if (error) {
    // Same ApiError shape as web — only the presentation differs.
    return (
      <Text className="p-4 text-red-600" accessibilityRole="alert">
        Couldn't load todos: {error.message}
      </Text>
    );
  }

  return (
    <View className="flex-1 p-4">
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="New todo"
        className="mb-2 rounded-lg border border-gray-300 px-3 py-2"
      />
      <Button
        title="Add"
        disabled={createTodo.isPending}
        onPress={() => {
          createTodo.mutate({ title });
          setTitle("");
        }}
      />
      {isLoading && <Text className="text-gray-500 mt-2">Loading…</Text>}
      <FlatList
        className="mt-2"
        data={todos}
        keyExtractor={(todo) => todo.id}
        renderItem={({ item }) => (
          <Text className="border-b border-gray-200 py-2">
            {item.title} {canCompleteTodo(item) ? "" : "(done)"}
          </Text>
        )}
      />
    </View>
  );
}
