/**
 * Optional auth actions surfaced inside shared UI (e.g. a sign-out button in the
 * settings panel). Desktop injects these; web leaves them null (it has its own
 * /account page).
 */
export interface AuthActions {
  signOut: () => Promise<void>;
}

let current: AuthActions | null = null;

export function configureAuthActions(actions: AuthActions | null): void {
  current = actions;
}

export function getAuthActions(): AuthActions | null {
  return current;
}
