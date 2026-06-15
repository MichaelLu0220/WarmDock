import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { createTask, useBootstrap, useSessionStore, useTaskStore } from "@warmdock/app";
import type { Task } from "@warmdock/core";
import { getClient } from "../client";

const STATUS_LABEL: Record<Task["status"], string> = {
  draft: "needs setup",
  ready: "ready",
  completed: "done",
};

export function Today({ userId }: { userId: string }) {
  const { isReady, bootstrapError } = useBootstrap(userId);
  const tasks = useTaskStore((s) => s.tasks);
  const isOffline = useSessionStore((s) => s.isOffline);

  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await createTask(t); // creates a draft (difficulty UI comes later)
      setTitle("");
    } catch {
      // error recorded in the task store
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Pressable onPress={() => void getClient().auth.signOut()}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      {isOffline && <Text style={styles.offline}>Offline — showing cached data only</Text>}
      {bootstrapError && <Text style={styles.error}>{bootstrapError}</Text>}
      {!isReady && <ActivityIndicator style={{ marginTop: 24 }} />}

      {isReady && (
        <>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a task…"
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={add}
              editable={!busy}
            />
            <Pressable style={styles.addBtn} onPress={add} disabled={busy}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>

          <FlatList
            data={tasks}
            keyExtractor={(t) => t.id}
            ListEmptyComponent={<Text style={styles.empty}>No tasks yet — add one above.</Text>}
            renderItem={({ item }) => (
              <View style={styles.task}>
                <Text style={[styles.taskTitle, item.status === "completed" && styles.done]}>
                  {item.title}
                </Text>
                <Text style={styles.badge}>{STATUS_LABEL[item.status]}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 20, backgroundColor: "#efe7d6" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#3a3326" },
  signOut: { fontSize: 14, color: "#5b5240" },
  offline: { marginTop: 10, padding: 8, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.06)", color: "#5b5240" },
  error: { marginTop: 10, color: "#b3402f" },
  addRow: { flexDirection: "row", marginTop: 16, marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#c9bfa6", borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: "#fff" },
  addBtn: { marginLeft: 8, width: 44, borderRadius: 8, backgroundColor: "#d9a35c", alignItems: "center", justifyContent: "center" },
  addBtnText: { fontSize: 22, color: "#2c2417" },
  task: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#dcd2b8" },
  taskTitle: { fontSize: 16, color: "#3a3326", flex: 1 },
  done: { textDecorationLine: "line-through", color: "#9a8f76" },
  badge: { fontSize: 12, color: "#8a7e63", marginLeft: 8 },
  empty: { marginTop: 24, color: "#8a7e63", textAlign: "center" },
});
