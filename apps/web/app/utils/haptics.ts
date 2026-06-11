import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function triggerHaptic(style: ImpactStyle): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.error('Failed to trigger haptic:', error);
  }
}

export async function hapticLight(): Promise<void> {
  await triggerHaptic(ImpactStyle.Light);
}

export async function hapticMedium(): Promise<void> {
  await triggerHaptic(ImpactStyle.Medium);
}

export async function hapticHeavy(): Promise<void> {
  await triggerHaptic(ImpactStyle.Heavy);
}
