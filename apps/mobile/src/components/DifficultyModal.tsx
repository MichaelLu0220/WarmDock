import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { discardTask, setTaskDetail, updateTaskTitle, useUnlockStore } from "@warmdock/app";
import { DIFFICULTY_OPTIONS, suggestDifficulty } from "@warmdock/core/rules/task";
import { canShowFocusTaskOption } from "@warmdock/core/rules/unlock";
import type { Difficulty, Task } from "@warmdock/core";

export function DifficultyModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const unlocks = useUnlockStore((s) => s.status);
  const [title, setTitle] = useState(task.title);
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [busy, setBusy] = useState(false);

  const suggested = suggestDifficulty(title);
  const options = DIFFICULTY_OPTIONS[suggested];
  const showFocus = canShowFocusTaskOption(unlocks);

  const persistTitle = async () => {
    const t = title.trim();
    if (t && t !== task.title) await updateTaskTitle(task.id, t);
  };

  async function confirm() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await persistTitle();
      await setTaskDetail(task.id, {
        difficultySuggested: suggested,
        difficulty: selected,
        isFocus: showFocus ? isFocus : false,
      });
      onClose();
    } catch {
      setBusy(false);
    }
  }

  // dismiss: empty title cancels the task; otherwise keep it as a draft
  async function later() {
    if (busy) return;
    setBusy(true);
    try {
      if (title.trim() === "") await discardTask(task.id);
      else await persistTitle();
    } catch {
      /* recorded in store */
    } finally {
      onClose();
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={later}>
      <Pressable style={styles.overlay} onPress={later}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Set task difficulty</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} editable={!busy} />
          <Text style={styles.hint}>Suggested: {suggested}</Text>

          <View style={styles.scores}>
            {options.map((s) => (
              <Pressable
                key={s}
                style={[styles.score, selected === s && styles.scoreOn]}
                onPress={() => setSelected(s)}
              >
                <Text style={styles.scoreText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {showFocus && (
            <Pressable style={styles.focusRow} onPress={() => setIsFocus((v) => !v)}>
              <View style={[styles.checkbox, isFocus && styles.checkboxOn]} />
              <Text style={styles.focusLabel}>Focus task (+1 point)</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.btn, (!selected || busy) && styles.btnDisabled]}
            disabled={!selected || busy}
            onPress={confirm}
          >
            <Text style={styles.btnText}>Confirm</Text>
          </Pressable>
          <Pressable style={styles.later} onPress={later} disabled={busy}>
            <Text style={styles.laterText}>Set later</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#f4ecd8", borderRadius: 12, padding: 20 },
  title: { fontSize: 18, fontWeight: "700", color: "#3a3326" },
  input: { borderWidth: 1, borderColor: "#c9bfa6", borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: "#fff", marginTop: 10 },
  hint: { color: "#8a7e63", marginTop: 8 },
  scores: { flexDirection: "row", gap: 8, marginTop: 10 },
  score: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: "#b58a4b", alignItems: "center", justifyContent: "center" },
  scoreOn: { backgroundColor: "#d9a35c" },
  scoreText: { fontSize: 16, color: "#2c2417" },
  focusRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: "#b58a4b", borderRadius: 4, marginRight: 8 },
  checkboxOn: { backgroundColor: "#d9a35c" },
  focusLabel: { color: "#3a3326" },
  btn: { backgroundColor: "#d9a35c", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 18 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: "600", color: "#2c2417" },
  later: { padding: 12, alignItems: "center", marginTop: 6 },
  laterText: { color: "#5b5240" },
});
