import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e551e28182a14433ad69ac1162d1dea7',
  appName: 'Morden Art Interior',
  webDir: 'dist',
  server: {
    url: 'https://e551e281-82a1-4433-ad69-ac1162d1dea7.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
