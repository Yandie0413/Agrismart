import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useNetwork } from '@/contexts/NetworkContext';

export default function OfflineBanner() {
  const { enLigne, actionsEnAttente } = useNetwork();

  if (enLigne) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.banner}>
        <Ionicons name="cloud-offline" size={14} color="#fff" />
        <Text style={styles.texte}>
          Mode hors-ligne{actionsEnAttente > 0 ? ` · ${actionsEnAttente} en attente` : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, backgroundColor: '#F97316' },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  texte: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
