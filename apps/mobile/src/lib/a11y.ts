import { AccessibilityInfo, type View } from 'react-native';

/** Moves VoiceOver / TalkBack focus to an element, e.g. a screen title after navigation. */
export function focusForAccessibility(target: View | null): void {
  if (target) AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
}
