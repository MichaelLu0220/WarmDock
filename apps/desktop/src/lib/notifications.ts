import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/** Ask the OS for permission (only after the user actively opts in). */
export async function ensureNotificationPermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    granted = (await requestPermission()) === "granted";
  }
  return granted;
}

export async function notify(title: string, body: string): Promise<void> {
  if (await isPermissionGranted()) {
    sendNotification({ title, body });
  }
}
