import type { View } from 'react-native';

/** Web (development preview): host components are DOM elements. */
export function focusForAccessibility(target: View | null): void {
  (target as unknown as HTMLElement | null)?.focus?.({ preventScroll: true });
}
