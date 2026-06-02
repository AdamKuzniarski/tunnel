import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadOnboardingCompleted,
  resetOnboardingCompleted,
  saveOnboardingCompleted,
} from '../onBoardingStorage';

describe('onBoardingStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('loadOnboardingCompleted', () => {
    it('returns false when there is no saved onboarding flag', async () => {
      await expect(loadOnboardingCompleted()).resolves.toBe(false);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('tunnel:onboarding-completed');
    });

    it('returns true after saving the onboarding flag', async () => {
      await saveOnboardingCompleted();

      await expect(loadOnboardingCompleted()).resolves.toBe(true);
    });
  });

  describe('saveOnboardingCompleted', () => {
    it('saves the onboarding completion flag to storage', async () => {
      await saveOnboardingCompleted();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('tunnel:onboarding-completed', 'true');
      await expect(loadOnboardingCompleted()).resolves.toBe(true);
    });
  });

  describe('resetOnboardingCompleted', () => {
    it('removes the saved onboarding completion flag', async () => {
      await saveOnboardingCompleted();

      await resetOnboardingCompleted();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('tunnel:onboarding-completed');
      await expect(loadOnboardingCompleted()).resolves.toBe(false);
    });
  });
});
