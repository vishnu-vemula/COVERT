interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
}

/** Web (development preview): React Native Web has no Alert, so use the browser dialog. */
export async function confirm({ title, message }: ConfirmOptions): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`);
}
