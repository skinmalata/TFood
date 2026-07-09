import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chat as chatApi, orders as ordersApi, reviews as reviewsApi } from '../services/api';
import { subscribeToOrder } from '../services/pusher';
import { colors, spacing, fontSize } from '../constants/theme';

export default function ChatScreen({ route, navigation }: any) {
  const { orderId, vendorName, showDispute } = route.params || {};
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDisputeForm, setShowDisputeForm] = useState(!!showDispute);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect => {
    const fetch = async () => {
      try {
        const res = await chatApi.getMessages(orderId);
        setMessages(res.data.data || []);
      } catch { }
      finally { setLoading(false); }
    };
    fetch();

    // Subscribe to real-time messages
    subscribeToOrder(orderId, (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, [orderId];

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      await chatApi.send({ orderId, content: text, messageType: 'text' });
      setText('');
    } catch { }
  };

  const submitDispute = async () => {
    if (!disputeReason) { Alert.alert('Error', 'Please provide a reason'); return; }
    try {
      await reviewsApi.create({ orderId, reason: disputeReason, description: disputeDesc });
      Alert.alert('Dispute Filed', 'Your dispute has been submitted for review.');
      setShowDisputeForm(false);
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message); }
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.sender_role === 'consumer';
    return (
      <View style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg]}>
        {item.message_type === 'voice' ? (
          <Text style={[styles.msgText, { fontStyle: 'italic' }]}>🎤 Voice message</Text>
        ) : item.message_type === 'image' ? (
          <Text style={[styles.msgText, { fontStyle: 'italic' }]}>📷 Image</Text>
        ) : (
          <Text style={[styles.msgText, !isMe && { color: colors.text }]}>{item.content}</Text>
        )}
        <Text style={[styles.msgTime, !isMe && { color: colors.textMuted }]}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back to Order</Text></TouchableOpacity>
      <Text style={styles.headerTitle}>Chat with {vendorName}</Text>

      {showDisputeForm && (
        <View style={styles.disputeForm}>
          <Text style={styles.disputeTitle}>Raise a Dispute</Text>
          <TextInput style={styles.input} placeholder="Reason (e.g., wrong order)" value={disputeReason} onChangeText={setDisputeReason} />
          <TextInput style={[styles.input, { minHeight: 80 }]} placeholder="Describe the issue..." value={disputeDesc} onChangeText={setDisputeDesc} multiline />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.submitBtn} onPress={submitDispute}><Text style={styles.submitBtnText}>Submit</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.textMuted }]} onPress={() => setShowDisputeForm(false)}><Text style={styles.submitBtnText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md }} style={{ flex: 1 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <TextInput style={styles.chatInput} placeholder="Type a message..." value={text} onChangeText={setText} multiline />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}><Text style={styles.sendBtnText}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back: { fontSize: fontSize.sm, color: colors.primary, padding: spacing.md, paddingBottom: 0 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '600', padding: spacing.md, paddingTop: spacing.xs },
  msgBubble: { maxWidth: '80%', padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 16, marginBottom: spacing.sm },
  myMsg: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMsg: { backgroundColor: colors.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: fontSize.md, color: colors.white },
  msgTime: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  chatInput: { flex: 1, backgroundColor: colors.background, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 20, maxHeight: 100, fontSize: fontSize.md },
  sendBtn: { backgroundColor: colors.primary, padding: 10, paddingHorizontal: 16, borderRadius: 20 },
  sendBtnText: { color: colors.white, fontWeight: '600' },
  disputeForm: { backgroundColor: colors.white, margin: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.warning },
  disputeTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.warning, marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, padding: spacing.sm, borderRadius: 8, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  submitBtn: { backgroundColor: colors.primary, padding: 8, paddingHorizontal: 16, borderRadius: 8 },
  submitBtnText: { color: colors.white, fontWeight: '500' },
});
