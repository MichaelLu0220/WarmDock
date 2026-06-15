import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { completeTask, useSessionStore } from "@warmdock/app";
import { canComplete, isCompleted, needsSetup } from "@warmdock/core/rules/task";
import type { Task } from "@warmdock/core";

export function TaskRow({ task, onSetup }: { task: Task; onSetup: (task: Task) => void }) {
  const [busy, setBusy] = useState(false);
  const done = isCompleted(task);
  const setup = needsSetup(task);

  async function complete() {
    if (!canComplete(task) || busy) return;
    setBusy(true);
    try {
      const result = await completeTask(task.id);
      if (result.allTasksCompleted) {
        useSessionStore.getState().setAllTasksCompleted(true);
      }
    } catch {
      /* recorded in store */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        if (setup) onSetup(task);
      }}
    >
      <Pressable
        style={[styles.check, done && styles.checkDone, !canComplete(task) && styles.checkDisabled]}
        disabled={!canComplete(task)}
        onPress={complete}
      >
        {done && <Text style={styles.tick}>✓</Text>}
      </Pressable>

      <Text style={[styles.title, done && styles.titleDone]}>{task.title}</Text>

      {setup ? (
        <Text style={styles.tagGold}>needs setup</Text>
      ) : task.difficulty != null ? (
        <Text style={styles.tagBlue}>{task.difficulty}</Text>
      ) : null}
      {task.isFocus && <Text style={styles.star}>★</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#dcd2b8" },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: "#b58a4b", alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkDone: { backgroundColor: "#8bA86a", borderColor: "#6f8a52" },
  checkDisabled: { opacity: 0.4 },
  tick: { color: "#fff", fontWeight: "700" },
  title: { flex: 1, fontSize: 16, color: "#3a3326" },
  titleDone: { textDecorationLine: "line-through", color: "#9a8f76" },
  tagGold: { fontSize: 12, color: "#8a6d2f", backgroundColor: "#ecdcb4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
  tagBlue: { fontSize: 13, color: "#2c4a6e", backgroundColor: "#cfe0f0", width: 26, textAlign: "center", paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  star: { marginLeft: 6, color: "#d9a35c" },
});
