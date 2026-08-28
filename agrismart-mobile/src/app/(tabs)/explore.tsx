import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';

export default function NotificationsScreen() {
  const { notifications, loading, refresh, marquerLue, marquerToutesLues } = useNotifications();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const iconParType: Record<string, keyof typeof Ionicons.glyphMap> = {
    meteo: 'rainy',
    conseil: 'bulb',
    systeme: 'information-circle',
    alerte: 'warning',
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some((n) => !n.notification_lue) && (
          <TouchableOpacity onPress={marquerToutesLues}>
            <Text style={styles.toutesLues}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.notification_id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint400} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
              <Text style={styles.vide}>Aucune notification pour le moment</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => !item.notification_lue && marquerLue(item.notification_id)}
            activeOpacity={0.7}>
            <ThemedCard style={StyleSheet.flatten([styles.card, !item.notification_lue && styles.cardNonLue])}>
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, !item.notification_lue && styles.iconWrapNonLue]}>
                  <Ionicons
                    name={iconParType[item.notification_type] || 'notifications'}
                    size={18}
                    color={!item.notification_lue ? colors.mint400 : colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitre}>{item.notification_titre}</Text>
                  <Text style={styles.cardContenu}>{item.notification_contenu}</Text>
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleString('fr-FR')}
                  </Text>
                </View>
                {!item.notification_lue && <View style={styles.dot} />}
              </View>
            </ThemedCard>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    title: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    toutesLues: { color: colors.mint400, fontSize: 13, fontWeight: '600' },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
    emptyState: { alignItems: 'center', marginTop: 60, gap: Spacing.sm },
    vide: { color: colors.textMuted, fontStyle: 'italic' },
    card: { marginBottom: Spacing.md },
    cardNonLue: { borderLeftWidth: 3, borderLeftColor: colors.mint400 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: Radius.full,
      backgroundColor: colors.forest800,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapNonLue: { backgroundColor: colors.forest700 },
    cardTitre: { fontSize: 15, fontWeight: 'bold', color: colors.white },
    cardContenu: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
    cardDate: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mint400, marginTop: 4 },
  });
}