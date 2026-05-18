import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'tunnel:onboarding-completed';

export async function loadOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
  return value === 'true';
}

export async function saveOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

export async function resetOnboardingCompleted(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
}
