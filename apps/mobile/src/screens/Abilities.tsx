import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { loadUnlockProgress, purchaseUnlock, useUnlockStore } from "@warmdock/app";
import type { UnlockNodeState } from "@warmdock/core";

const NODE_LABEL: Record<string, string> = {
  "root.awaken": "Awaken",
  "slots.4": "4 task slots",
  "slots.5": "5 task slots",
  "slots.6": "6 task slots",
  "slots.7": "7 task slots",
  "focus.basic": "Focus tasks",
  "time.custom_refresh": "Custom reset time",
  "analysis.weekly": "Weekly analysis",
};

const CATEGORY_LABEL: Record<string, string> = {
  root: "Core",
  capacity: "Capacity",
  focus: "Focus",
  time: "Rhythm",
  analysis: "Analysis",
};

export function Abilities({ onClose }: { onClose: () => void }) {
  const progress = useUnlockStore((s) => s.progress);
  const isLoading = useUnlockStore((s) => s.isLoading);
  const [busyNode, setBusyNode] = useState<string | null>(null);

  useEffect(() => {
    void loadUnlockProgress();
  }, []);

  async function buy(nodeId: string) {
    if (busyNode) return;
    setBusyNode(nodeId);
    try {
      await purchaseUnlock(nodeId); // reloads progress on success
    } catch {
      /* recorded in store */
    } finally {
      setBusyNode(null);
    }
  }

  const available = progress?.availablePoints ?? 0;

  function stateText(n: UnlockNodeState): string {
    if (n.unlocked) return "Unlocked";
    if (!n.requirementsMet) return "Locked";
    if (n.cost > available) return `Need ${n.cost - available} more`;
    return `Unlock · ${n.cost}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Abilities</Text>
        <View style={styles.headerRight}>
          <Text style={styles.points}>◆ {available}</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
      </View>

      {isLoading && !progress && <ActivityIndicator style={{ marginTop: 24 }} />}

      <FlatList
        data={progress?.nodes ?? []}
        keyExtractor={(n) => n.nodeId}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => {
          const canBuy = !item.unlocked && item.affordable;
          return (
            <View style={[styles.card, item.unlocked && styles.cardUnlocked]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nodeTitle}>{NODE_LABEL[item.nodeId] ?? item.nodeId}</Text>
                <Text style={styles.nodeMeta}>
                  {CATEGORY_LABEL[item.category] ?? item.category}
                  {item.cost > 0 ? ` · ${item.cost} pts` : ""}
                </Text>
              </View>
              <Pressable
                style={[styles.action, canBuy ? styles.actionBuy : styles.actionDisabled]}
                disabled={!canBuy || busyNode === item.nodeId}
                onPress={() => buy(item.nodeId)}
              >
                <Text style={[styles.actionText, canBuy && styles.actionTextBuy]}>
                  {busyNode === item.nodeId ? "…" : stateText(item)}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 20, backgroundColor: "#efe7d6" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#3a3326" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  points: { fontSize: 14, color: "#5b5240" },
  close: { fontSize: 14, color: "#8a7e63" },
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 10, backgroundColor: "#f4ecd8", borderWidth: 1, borderColor: "#dcd2b8", marginBottom: 10 },
  cardUnlocked: { opacity: 0.6 },
  nodeTitle: { fontSize: 16, color: "#3a3326", fontWeight: "600" },
  nodeMeta: { fontSize: 13, color: "#8a7e63", marginTop: 2 },
  action: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBuy: { backgroundColor: "#d9a35c" },
  actionDisabled: { backgroundColor: "transparent" },
  actionText: { fontSize: 13, color: "#8a7e63" },
  actionTextBuy: { color: "#2c2417", fontWeight: "600" },
});
