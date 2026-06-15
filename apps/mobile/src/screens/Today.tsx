import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  createTask,
  useBootstrap,
  useSessionStore,
  useTaskStore,
  useWalletStore,
} from "@warmdock/app";
import { availablePoints } from "@warmdock/core/rules/points";
import type { Task } from "@warmdock/core";
import { getClient } from "../client";
import { TaskRow } from "../components/TaskRow";
import { DifficultyModal } from "../components/DifficultyModal";

export function Today({ userId }: { userId: string }) {
  const { isReady, bootstrapError } = useBootstrap(userId);
  const tasks = useTaskStore((s) => s.tasks);
  const wallet = useWalletStore((s) => s.wallet);
  const isOffline = useSessionStore((s) => s.isOffline);
  const isDaySettled = useSessionStore((s) => s.isDaySettled);
  const allDone = useSessionStore((s) => s.allTasksCompleted);
  const summary = useSessionStore((s) => s.todaySummary);

  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [peek, setPeek] = useState(false);
  const [setupTask, setSetupTask] = useState<Task | null>(null);

  const points = wallet ? availablePoints(wallet) : 0;
  const streak = wallet?.streakDays ?? 0;

  async function add() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const task = await createTask(t);
      setTitle("");
      setSetupTask(task); // open difficulty setup immediately
    } catch {
      /* recorded in store */
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <View style={styles.headerRight}>
          <Text style={styles.stat}>◆ {points}</Text>
          <Text style={styles.stat}>▲ {streak}d</Text>
          <Pressable onPress={() => void getClient().auth.signOut()}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      {isOffline && <Text style={styles.offline}>Offline — showing cached data only</Text>}
      {bootstrapError && <Text style={styles.error}>{bootstrapError}</Text>}
      {!isReady && <ActivityIndicator style={{ marginTop: 24 }} />}

      {isReady && allDone && !peek ? (
        <View style={styles.ceremony}>
          <Text style={styles.ceremonyTitle}>Every promise kept today</Text>
          <Text style={styles.ceremonySub}>Rest well — see you tomorrow.</Text>
          <View style={styles.ceremonyStats}>
            <Stat label="Points" value={summary?.pointsEarned ?? 0} />
            <Stat label="Done" value={summary?.tasksCompleted ?? 0} />
            <Stat label="Streak" value={streak} />
          </View>
          <Pressable style={styles.ghostBtn} onPress={() => setPeek(true)}>
            <Text style={styles.ghostBtnText}>View today&apos;s tasks</Text>
          </Pressable>
        </View>
      ) : isReady ? (
        <>
          {!isDaySettled && (
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
          )}
          <FlatList
            data={tasks}
            keyExtractor={(t) => t.id}
            ListEmptyComponent={<Text style={styles.empty}>No tasks yet — add one above.</Text>}
            renderItem={({ item }) => <TaskRow task={item} onSetup={setSetupTask} />}
          />
        </>
      ) : null}

      {setupTask && <DifficultyModal task={setupTask} onClose={() => setSetupTask(null)} />}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 20, backgroundColor: "#efe7d6" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#3a3326" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  stat: { fontSize: 14, color: "#5b5240" },
  signOut: { fontSize: 14, color: "#8a7e63" },
  offline: { marginTop: 10, padding: 8, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.06)", color: "#5b5240" },
  error: { marginTop: 10, color: "#b3402f" },
  addRow: { flexDirection: "row", marginTop: 16, marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#c9bfa6", borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: "#fff" },
  addBtn: { marginLeft: 8, width: 44, borderRadius: 8, backgroundColor: "#d9a35c", alignItems: "center", justifyContent: "center" },
  addBtnText: { fontSize: 22, color: "#2c2417" },
  empty: { marginTop: 24, color: "#8a7e63", textAlign: "center" },
  ceremony: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  ceremonyTitle: { fontSize: 22, fontWeight: "700", color: "#3a3326", textAlign: "center" },
  ceremonySub: { fontSize: 15, color: "#5b5240", marginTop: 8 },
  ceremonyStats: { flexDirection: "row", gap: 24, marginTop: 28 },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "700", color: "#3a3326" },
  statLabel: { fontSize: 13, color: "#8a7e63", marginTop: 4 },
  ghostBtn: { marginTop: 32, paddingVertical: 10, paddingHorizontal: 18 },
  ghostBtnText: { color: "#5b5240", fontSize: 15 },
});
