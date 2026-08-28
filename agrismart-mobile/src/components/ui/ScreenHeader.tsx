import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Spacing } from '@/constants/appTheme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ScreenHeader({
  titre,
  sousTitre,
  droite,
}: {
  titre: string;
  sousTitre?: string;
  droite?: ReactNode;
}) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.forest900, borderBottomColor: colors.forest700 }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.bouton}>
        <Ionicons name="arrow-back" size={22} color={colors.white} />
      </TouchableOpacity>
      <View style={styles.titreBloc}>
        <Text style={[styles.titre, { color: colors.white }]} numberOfLines={1}>
          {titre}
        </Text>
        {sousTitre ? (
          <Text style={[styles.sousTitre, { color: colors.textMuted }]} numberOfLines={1}>
            {sousTitre}
          </Text>
        ) : null}
      </View>
      <View style={styles.droite}>{droite}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  bouton: { padding: Spacing.xs },
  titreBloc: { flex: 1 },
  titre: { fontSize: 17, fontWeight: '700' },
  sousTitre: { fontSize: 11, marginTop: 1 },
  droite: { minWidth: 24, alignItems: 'flex-end' },
});
