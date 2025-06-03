import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/authContext';
import {
  GET_CHAT_MESSAGES,
  SEND_MESSAGE,
  MESSAGE_SENT
} from '../apollo/chat';

const ChatRoomScreen = ({ route, navigation }) => {
  const { roomId, contactName } = route.params;
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef();
  
  // Get chat messages with enhanced caching strategy
  const { 
    data, 
    loading, 
    error, 
    refetch 
  } = useQuery(GET_CHAT_MESSAGES, {
    variables: { roomId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first'
  });

  // Send message mutation with optimistic response
  const [sendMessage] = useMutation(SEND_MESSAGE, {
    optimisticResponse: (vars) => ({
      sendMessage: {
        _id: `temp-${Date.now()}`,
        message: vars.input.message,
        sender_id: user?._id,
        created_at: new Date().toISOString(),
        __typename: 'Chat'
      }
    }),
    update: (cache, { data: mutationData }) => {
      const existingMessages = cache.readQuery({
        query: GET_CHAT_MESSAGES,
        variables: { roomId }
      })?.getRoomMessages || [];

      const newMessage = mutationData.sendMessage;
      
      cache.writeQuery({
        query: GET_CHAT_MESSAGES,
        variables: { roomId },
        data: {
          getRoomMessages: [newMessage, ...existingMessages]
        }
      });
    }
  });

  // Subscribe to new messages with proper error handling and duplicate prevention
  useSubscription(MESSAGE_SENT, {
    variables: { roomId },
    onData: ({ data: subData }) => {
      const newMessage = subData?.data?.messageReceived;
      if (newMessage) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg._id === newMessage._id);
          if (!messageExists) {
            // Add new message and maintain order (newest first)
            return [newMessage, ...prev];
          }
          return prev;
        });
      }
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    }
  });

  // Update messages when query data changes
  useEffect(() => {
    if (data?.getRoomMessages) {
      setMessages(data.getRoomMessages);
    }
  }, [data]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const optimisticId = `temp-${Date.now()}`;
      // Add optimistic message
      setMessages(prev => [{
        _id: optimisticId,
        message: message.trim(),
        sender_id: user?._id,
        created_at: new Date().toISOString(),
      }, ...prev]);

      await sendMessage({
        variables: {
          input: {
            room_id: roomId,
            message: message.trim(),
          },
        },
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item: msg }) => {
    const isOwnMessage = msg.sender_id === user?._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {msg.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
          ]}>
            {new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FF9A62", "#FE7A3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{contactName}</Text>
          <Text style={styles.headerSubtitle}>Landowner</Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          inverted
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? '#FFFFFF' : '#A1A1AA'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: '#FE7A3A',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FE7A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default ChatRoomScreen;
