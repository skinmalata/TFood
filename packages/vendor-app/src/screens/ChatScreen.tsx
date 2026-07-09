import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chat as chatApi } from '../services/api';
import { subscribeToOrder } from '../services/pusher';
import { colors, spacing, fontSize } from '../constants/theme';

export default function ChatScreen({ route, navigation }: any) {
  const { orderId, customerName } = route.params || {};
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await chatApi.getMessages(orderId);
        setMessages(res.data.data || []);
      } catch { }
    };
    fetch();
    subscribeToOrder(orderId, (msg: any) => setMessages((prev) => [...prev, msg]));
  }, [orderId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      await chatApi.send({ orderId, content: text, messageType: 'text' });
      setText('');
    } catch { }
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.sender_role === 'vendor';
    return (
      <View style={[styles.bubble, isMe ? styles.myMsg : styles.theirMsg]}>
        <Text style={[styles.msgText, !isMe && { color: colors.text }]}>{item.content}</Text>
        <Text style={[styles.time, !isMe && { color: colors.textMuted }]}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
      <Text style={styles.title}>Chat with Customer</Text>
      <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md }} style={{ flex: 1 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <TextInput style={styles.input} placeholder="Reply..." value={text} onChangeText={setText} multiline />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}><Text style={styles.sendBtnText}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back: { fontSize: fontSize.sm, color: colors.primary, padding: spacing.md, paddingBottom: 0 },
  title: { fontSize: fontSize.lg, fontWeight: '600', padding: spacing.md, paddingTop: spacing.xs },
  bubble: { maxWidth: '80%', padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 16, marginBottom: spacing.sm },
  myMsg: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMsg: { backgroundColor: colors.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: fontSize.md, color: colors.white },
  time: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  input: { flex: 1, backgroundColor: colors.background, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 20, maxHeight: 100, fontSize: fontSize.md },
  sendBtn: { backgroundColor: colors.primary, padding: 10, paddingHorizontal: 16, borderRadius: 20 },
  sendBtnText: { color: colors.white, fontWeight: '600' },
});
