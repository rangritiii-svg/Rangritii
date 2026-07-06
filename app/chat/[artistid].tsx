import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, ChatMessage } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { conversationId, subscribeToChat } from "@/firebase/firestoreService";

export default function ChatScreen() {
  const { artistid } = useLocalSearchParams<{ artistid: string }>();
  const artistId = artistid;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getArtistById, sendMessage, userProfile } = useApp();

  const [inputVal, setInputVal] = useState("");
  const [chatList, setChatList] = useState<ChatMessage[]>([]);
  const artist = getArtistById(artistid as string);

  // Live subscription to this conversation's messages in Firestore
  useEffect(() => {
    if (!artistId) return;
    const convId = conversationId(userProfile.phone, artistId as string);
    const unsub = subscribeToChat(convId, (msgs) => setChatList(msgs as ChatMessage[]));
    return () => { try { unsub(); } catch { /* noop */ } };
  }, [artistId, userProfile.phone]);

  // Sort newest first for the inverted FlatList
  const messages = useMemo(() => {
    return [...chatList].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [chatList]);

  if (!artist) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.text }]}>Artist not found.</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: colors.primaryForeground, fontFamily: "Poppins_600SemiBold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSend = () => {
    const trimmed = inputVal.trim();
    if (trimmed.length === 0) return;
    sendMessage(artist.id, trimmed);
    setInputVal("");
  };

  const initials = artist.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header bar */}
      <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtnHeader} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={[styles.headerAvatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.headerAvatarText, { color: colors.secondaryForeground }]}>{initials}</Text>
        </View>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{artist.name}</Text>
          <Text style={[styles.headerStatus, { color: artist.availability === "Busy" ? colors.destructive : "#1A7A4A" }]}>
            {artist.availability === "Busy" ? "Offline" : "Online"}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerCallBtn}>
          <Ionicons name="call-outline" size={20} color={colors.secondaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Message List (Inverted) */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        renderItem={({ item }) => {
          const isUser = item.senderId === "user";
          const msgTime = new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <View style={[styles.messageRow, isUser ? styles.rowUser : styles.rowArtist]}>
              {!isUser && (
                <View style={[styles.bubbleAvatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.bubbleAvatarText, { color: colors.secondaryForeground }]}>{initials}</Text>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  isUser
                    ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                    : [styles.bubbleArtist, { backgroundColor: colors.card, borderColor: colors.border }],
                ]}
              >
                <Text style={[styles.bubbleText, { color: isUser ? colors.primaryForeground : colors.text }]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, { color: isUser ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                  {msgTime}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.secondary }]}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.secondaryForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Ask {artist.name} about design configurations, pricing custom slots, or location availability.
            </Text>
          </View>
        }
      />

      {/* Input controls bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(12, insets.bottom + 8) }]}>
        <TextInput
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={inputVal}
          onChangeText={setInputVal}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: inputVal.trim().length > 0 ? colors.primary : colors.muted }]}
          onPress={handleSend}
          disabled={inputVal.trim().length === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={16} color={inputVal.trim().length > 0 ? colors.primaryForeground : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    height: 72,
  },
  backBtnHeader: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  headerStatus: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  headerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
    maxWidth: "80%",
    alignItems: "flex-end",
  },
  rowUser: {
    alignSelf: "flex-end",
  },
  rowArtist: {
    alignSelf: "flex-start",
    gap: 8,
  },
  bubbleAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bubbleAvatarText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
  },
  bubbleUser: {
    borderBottomRightRadius: 2,
  },
  bubbleArtist: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
  },
  bubbleTime: {
    fontSize: 8,
    fontFamily: "Poppins_400Regular",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 120,
    transform: [{ scaleY: -1 }], // Must invert empty component as well in inverted lists
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
