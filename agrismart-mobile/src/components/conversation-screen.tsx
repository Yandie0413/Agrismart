import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { envoyerMessage, getConversation, partagerDocument, Message } from '@/services/messageService';
import { UPLOADS_BASE_URL } from '@/constants/api';

export default function ConversationScreen({
  destinataireId,
  destinataireNom,
  onRetour,
}: {
  destinataireId: number;
  destinataireNom?: string;
  onRetour: () => void;
}) {
  const { utilisateur, token } = useAuth();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const listRef = useRef<FlatList>(null);

  const charger = useCallback(async () => {
    try {
      const data = await getConversation(destinataireId, token);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [destinataireId, token]);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 5000);
    return () => clearInterval(interval);
  }, [charger]);

  async function handleEnvoyer() {
    if (!texte.trim()) return;
    setEnvoi(true);
    try {
      await envoyerMessage(destinataireId, texte.trim(), token);
      setTexte('');
      await charger();
    } finally {
      setEnvoi(false);
    }
  }

  async function envoyerPhoto(asset: ImagePicker.ImagePickerAsset) {
    const nom = asset.uri.split('/').pop() || `photo-${Date.now()}.jpg`;
    const type = asset.mimeType || 'image/jpeg';

    setEnvoi(true);
    try {
      await partagerDocument(destinataireId, texte.trim(), { uri: asset.uri, name: nom, type }, token);
      setTexte('');
      await charger();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Impossible d'envoyer la photo");
    } finally {
      setEnvoi(false);
    }
  }

  async function handleChoisirPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorise l'acces a la galerie pour partager une photo.");
      return;
    }

    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (resultat.canceled || !resultat.assets?.[0]) return;
    await envoyerPhoto(resultat.assets[0]);
  }

  async function handlePrendrePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorise l'acces a la camera pour prendre une photo.");
      return;
    }

    const resultat = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (resultat.canceled || !resultat.assets?.[0]) return;
    await envoyerPhoto(resultat.assets[0]);
  }

  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onRetour} hitSlop={10} style={styles.retourBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarTxt}>{(destinataireNom || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.titre} numberOfLines={1}>
            {destinataireNom || 'Conversation'}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.message_id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const estMoi = item.expediteur_id === utilisateur?.id;
            return (
              <View style={[styles.bulle, estMoi ? styles.bulleMoi : styles.bulleAutre]}>
                {item.message_document && (
                  <Image
                    source={{ uri: `${UPLOADS_BASE_URL}/uploads/${item.message_document}` }}
                    style={styles.imageMessage}
                    resizeMode="cover"
                  />
                )}
                {item.message_contenu ? (
                  <Text style={estMoi ? styles.texteMoi : styles.texteAutre}>
                    {item.message_contenu}
                  </Text>
                ) : null}
                <Text style={styles.heure}>
                  {new Date(item.message_date_envoi).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.photoBtn} onPress={handlePrendrePhoto} disabled={envoi}>
            <Ionicons name="camera" size={20} color={colors.mint400} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={handleChoisirPhoto} disabled={envoi}>
            <Ionicons name="image" size={20} color={colors.mint400} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ecrire un message..."
            placeholderTextColor={colors.textMuted}
            value={texte}
            onChangeText={setTexte}
            multiline
          />
          <TouchableOpacity style={styles.envoyerBtn} onPress={handleEnvoyer} disabled={envoi}>
            {envoi ? (
              <ActivityIndicator color={colors.forest950} size="small" />
            ) : (
              <Ionicons name="send" size={17} color={colors.forest950} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.forest700,
    },
    retourBtn: { padding: 2 },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.forest700,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerAvatarTxt: { color: colors.mint400, fontWeight: '800', fontSize: 15 },
    titre: { fontSize: 16, fontWeight: '700', color: colors.white, flex: 1 },
    listContent: { padding: 16, gap: 8 },
    bulle: { maxWidth: '75%', borderRadius: 18, padding: 12, marginBottom: 8 },
    bulleMoi: { backgroundColor: colors.mint400, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    bulleAutre: { backgroundColor: colors.forest800, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    texteMoi: { color: colors.forest950, fontSize: 14 },
    texteAutre: { color: colors.white, fontSize: 14 },
    heure: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
    imageMessage: {
      width: 200,
      height: 200,
      borderRadius: 8,
      marginBottom: 6,
    },
    inputBar: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.forest700,
      alignItems: 'flex-end',
      gap: 8,
    },
    photoBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.forest800,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 100,
      color: colors.white,
    },
    envoyerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.mint400,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}