import { useState } from 'react';

import LoginScreen from '@/components/login-screen';
import OnboardingScreen from '@/components/onboarding-screen';

// Point d'entree "deconnecte" : reprend l'onboarding puis le login,
// deplace ici depuis RootNavigator pour permettre au login de naviguer
// vers un ecran "mot de passe oublie" dedie via expo-router.
export default function AuthIndex() {
  const [vueNonConnecte, setVueNonConnecte] = useState<'onboarding' | 'login'>('onboarding');

  function terminerOnboarding() {
    setVueNonConnecte('login');
  }

  return vueNonConnecte === 'onboarding' ? (
    <OnboardingScreen onTerminer={terminerOnboarding} />
  ) : (
    <LoginScreen onDecouvrir={() => setVueNonConnecte('onboarding')} />
  );
}
