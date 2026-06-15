import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { getClient } from "../client";

function message(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}

export function SignIn() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!ageOk) return setError("Please confirm you are 13 or older.");
    setBusy(true);
    setError(null);
    try {
      await getClient().auth.signInWithEmailOtp(email.trim());
      setSent(true);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      // App's onAuthStateChange swaps to the Today screen on success.
      await getClient().auth.verifyEmailOtp(email.trim(), otp.trim());
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WarmDock</Text>
      <Text style={styles.subtitle}>Sign in to finish what matters today.</Text>

      <Pressable style={styles.checkRow} onPress={() => setAgeOk((v) => !v)}>
        <View style={[styles.checkbox, ageOk && styles.checkboxOn]} />
        <Text style={styles.checkLabel}>I am 13 or older</Text>
      </Pressable>

      {!sent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Pressable style={[styles.btn, (!ageOk || busy) && styles.btnDisabled]} disabled={!ageOk || busy} onPress={send}>
            <Text style={styles.btnText}>Email me a sign-in code</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.note}>We sent a code to {email}.</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <Pressable style={[styles.btn, busy && styles.btnDisabled]} disabled={busy} onPress={verify}>
            <Text style={styles.btnText}>Verify &amp; continue</Text>
          </Pressable>
        </>
      )}

      {busy && <ActivityIndicator style={{ marginTop: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#efe7d6" },
  title: { fontSize: 32, fontWeight: "700", color: "#3a3326" },
  subtitle: { fontSize: 15, color: "#5b5240", marginTop: 6, marginBottom: 20 },
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: "#b58a4b", borderRadius: 4, marginRight: 8 },
  checkboxOn: { backgroundColor: "#d9a35c" },
  checkLabel: { fontSize: 15, color: "#3a3326" },
  input: { borderWidth: 1, borderColor: "#c9bfa6", borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: "#fff", marginBottom: 12 },
  btn: { backgroundColor: "#d9a35c", borderRadius: 8, padding: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: "600", color: "#2c2417" },
  note: { color: "#5b5240", marginBottom: 8 },
  error: { color: "#b3402f", marginTop: 12 },
});
