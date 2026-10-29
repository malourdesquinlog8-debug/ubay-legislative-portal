import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Settings {
  logo_url: string;
  icon_url: string;
  site_title: string;
}

interface SettingsContextType {
  settings: Settings;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    logo_url: '/sblogo.jpg',
    icon_url: '/sblogo.jpg',
    site_title: 'Sangguniang Bayan - UBAY, Bohol',
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (!error && data) {
        setSettings({
          logo_url: data.logo_url || '/sblogo.jpg',
          icon_url: data.icon_url || '/sblogo.jpg',
          site_title: data.site_title || 'Sangguniang Bayan - UBAY, Bohol',
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}