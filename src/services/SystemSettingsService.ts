import {
      getFirestore,
      doc,
      getDoc,
      setDoc,
      updateDoc
    } from 'firebase/firestore'

    export interface SystemSettings {
      taskCompletionBase: number;
      complexityMultiplier: number;
      monthlyBonus: number;
      // Add other settings as needed
    }

    const SETTINGS_DOC_ID = 'settings'; // Use a constant ID

    export class SystemSettingsService {
      private db = getFirestore();
      private settingsDocRef = doc(this.db, 'system', SETTINGS_DOC_ID);

      async getSettings(): Promise<SystemSettings> {
        try {
          const docSnap = await getDoc(this.settingsDocRef);
          if (docSnap.exists()) {
            return docSnap.data() as SystemSettings;
          } else {
            // Return default settings if the document doesn't exist
            return {
              taskCompletionBase: 10,
              complexityMultiplier: 1.5,
              monthlyBonus: 50
            };
          }
        } catch (error) {
          console.error("Error fetching system settings:", error);
          throw error; // Re-throw the error for handling in the component
        }
      }

      async updateSettings(updates: Partial<SystemSettings>): Promise<void> {
        try {
          await updateDoc(this.settingsDocRef, updates);
        } catch (error) {
          console.error("Error updating system settings:", error);
          throw error;
        }
      }

      // Initial setup (optional, for first-time setup)
      async initializeSettings(initialSettings: SystemSettings): Promise<void> {
          try {
              const docSnap = await getDoc(this.settingsDocRef);
              if (!docSnap.exists()) {
                await setDoc(this.settingsDocRef, initialSettings);
              }
          } catch(error) {
              console.error("Error initializing settings", error);
              throw error;
          }
      }
    }

    export const systemSettingsService = new SystemSettingsService();
