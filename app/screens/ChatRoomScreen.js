import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Alert,
  ActivityIndicator,
  AppState,
} from "react-native";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/authContext";
import {
  GET_CHAT_MESSAGES,
  SEND_MESSAGE,
  MESSAGE_RECEIVED,
  MESSAGE_SENT,
} from "../apollo/chat";

const ChatRoomScreen = ({ route, navigation }) => {
  // Validate route params
  const roomId = route?.params?.roomId;
  const contactName = route?.params?.contactName || "Unknown";

  if (!roomId) {
    Alert.alert("Error", "Invalid chat room");
    navigation.goBack();
    return null;
  }

  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const flatListRef = useRef();
  const autoRefreshInterval = useRef(null);
  const appState = useRef(AppState.currentState);

  // Enhanced query with polling
  const { data, loading, error, refetch } = useQuery(GET_CHAT_MESSAGES, {
    variables: { roomId },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    pollInterval: 0, // We'll handle polling manually for better control
    onCompleted: (data) => {
      console.log("Messages loaded:", data?.getRoomMessages?.length || 0);
      if (data?.getRoomMessages && Array.isArray(data.getRoomMessages)) {
        try {
          const validMessages = data.getRoomMessages
            .filter((msg) => msg && msg._id && msg.message)
            .map((msg) => ({
              ...msg,
              created_at: msg.created_at || new Date().toISOString(),
              message: String(msg.message || ""),
              sender_id: msg.sender_id || msg.sender?._id,
            }));

          const sortedMessages = validMessages.sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          // Check if new messages arrived
          const newMessageCount = sortedMessages.length;
          if (newMessageCount > lastMessageCount && !isInitialLoad) {
            // New message detected, scroll to bottom
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
          setLastMessageCount(newMessageCount);

          setMessages(sortedMessages);
          setIsInitialLoad(false);
          setConnectionStatus("connected");
          setIsAutoRefreshing(false);

          // Auto scroll to bottom after initial load
          if (isInitialLoad) {
            setTimeout(() => {
              scrollToBottom();
            }, 200);
          }
        } catch (error) {
          console.error("Error processing messages:", error);
          setMessages([]);
          setIsInitialLoad(false);
          setIsAutoRefreshing(false);
        }
      } else {
        setMessages([]);
        setIsInitialLoad(false);
        setIsAutoRefreshing(false);
      }
    },
    onError: (error) => {
      console.error("Query error:", error);
      setIsInitialLoad(false);
      setConnectionStatus("error");
      setIsAutoRefreshing(false);
    },
  });

  // Enhanced send message mutation
  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE, {
    errorPolicy: "all",
    onCompleted: (data) => {
      console.log("Message sent successfully:", data?.sendMessage);
      if (data?.sendMessage) {
        const newMessage = {
          ...data.sendMessage,
          created_at: data.sendMessage.created_at || new Date().toISOString(),
          message: String(data.sendMessage.message || ""),
          sender_id: data.sendMessage.sender_id || user._id,
        };

        // Add to messages if not already present
        setMessages((prevMessages) => {
          const messageExists = prevMessages.some(
            (msg) => msg._id === newMessage._id
          );
          if (!messageExists) {
            const updatedMessages = [...prevMessages, newMessage].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
            setTimeout(() => scrollToBottom(), 100);
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    },
    onError: (error) => {
      console.error("Send message error:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    },
  });

  // Primary subscription with MESSAGE_RECEIVED
  const {
    data: subscriptionData,
    error: subscriptionError,
    loading: subscriptionLoading,
  } = useSubscription(MESSAGE_RECEIVED, {
    variables: { room_id: roomId },
    skip: !roomId || !user?._id,
    shouldResubscribe: true,
    fetchPolicy: "no-cache",
    onData: ({ data: subscriptionPayload }) => {
      console.log("MESSAGE_RECEIVED subscription data:", subscriptionPayload);

      try {
        const newMessage = subscriptionPayload?.data?.messageReceived;
        if (newMessage && newMessage._id && newMessage.message) {
          console.log("Processing new message from subscription:", newMessage);

          const processedMessage = {
            ...newMessage,
            created_at: newMessage.created_at || new Date().toISOString(),
            message: String(newMessage.message || ""),
            sender_id: newMessage.sender_id || newMessage.sender?._id,
          };

          setMessages((prevMessages) => {
            const messageExists = prevMessages.some(
              (msg) => msg._id === processedMessage._id
            );

            if (!messageExists) {
              console.log(
                "Adding new message to state:",
                processedMessage.message
              );
              const updatedMessages = [...prevMessages, processedMessage].sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
              );

              setTimeout(() => scrollToBottom(), 100);
              return updatedMessages;
            }

            return prevMessages;
          });

          setConnectionStatus("connected");
        }
      } catch (error) {
        console.error("Error processing subscription data:", error);
      }
    },
    onError: (error) => {
      console.error("MESSAGE_RECEIVED subscription error:", error);
      setConnectionStatus("error");
    },
  });

  // Fallback subscription with MESSAGE_SENT
  const { data: fallbackSubscriptionData, error: fallbackSubscriptionError } =
    useSubscription(MESSAGE_SENT, {
      variables: { room_id: roomId },
      skip: !roomId || !user?._id || !subscriptionError, // Only use if primary subscription fails
      shouldResubscribe: true,
      fetchPolicy: "no-cache",
      onData: ({ data: subscriptionPayload }) => {
        console.log(
          "MESSAGE_SENT fallback subscription data:",
          subscriptionPayload
        );

        try {
          const newMessage = subscriptionPayload?.data?.messageSent;
          if (newMessage && newMessage._id && newMessage.message) {
            const processedMessage = {
              ...newMessage,
              created_at: newMessage.created_at || new Date().toISOString(),
              message: String(newMessage.message || ""),
              sender_id: newMessage.sender_id || newMessage.sender?._id,
            };

            setMessages((prevMessages) => {
              const messageExists = prevMessages.some(
                (msg) => msg._id === processedMessage._id
              );
              if (!messageExists) {
                const updatedMessages = [
                  ...prevMessages,
                  processedMessage,
                ].sort(
                  (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
                setTimeout(() => scrollToBottom(), 100);
                return updatedMessages;
              }
              return prevMessages;
            });

            setConnectionStatus("connected");
          }
        } catch (error) {
          console.error("Error processing fallback subscription data:", error);
        }
      },
      onError: (error) => {
        console.error("MESSAGE_SENT fallback subscription error:", error);
      },
    });

  // Monitor connection status
  useEffect(() => {
    if (subscriptionError && fallbackSubscriptionError) {
      console.error("Both subscriptions failed:", {
        primary: subscriptionError,
        fallback: fallbackSubscriptionError,
      });
      setConnectionStatus("disconnected");
    } else if (subscriptionError && !fallbackSubscriptionError) {
      console.log("Using fallback subscription");
      setConnectionStatus("fallback");
    } else if (!subscriptionError) {
      setConnectionStatus("connected");
    }
  }, [subscriptionError, fallbackSubscriptionError]);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      try {
        flatListRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        console.warn("Scroll error:", error);
      }
    }
  }, [messages.length]);

  // Auto refresh function
  const performAutoRefresh = useCallback(async () => {
    if (loading || isAutoRefreshing) return;

    try {
      setIsAutoRefreshing(true);
      console.log("Auto-refreshing messages...");
      await refetch();
    } catch (error) {
      console.error("Auto refresh error:", error);
      setIsAutoRefreshing(false);
    }
  }, [loading, isAutoRefreshing, refetch]);

  // Setup auto refresh interval
  useEffect(() => {
    if (!roomId || !user?._id) return;

    // Start auto refresh when component mounts
    const startAutoRefresh = () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }

      // Refresh every 1 second (1000ms) for near real-time experience
      // You can adjust this interval: 500ms for more frequent, 2000ms for less frequent
      autoRefreshInterval.current = setInterval(() => {
        if (appState.current === "active") {
          performAutoRefresh();
        }
      }, 1000);
    };

    // Start auto refresh after initial load
    if (!isInitialLoad) {
      startAutoRefresh();
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [roomId, user?._id, isInitialLoad, performAutoRefresh]);

  // Handle app state changes (pause auto refresh when app is in background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground, immediately refresh and resume auto refresh
        console.log("App came to foreground, refreshing...");
        performAutoRefresh();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [performAutoRefresh]);

  // Enhanced message sending with optimistic updates
  const handleSendMessage = async () => {
    if (!message.trim() || sendingMessage) return;

    const messageText = message.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const now = new Date().toISOString();

    // Clear input immediately for better UX
    setMessage("");

    // Add optimistic message
    const optimisticMessage = {
      _id: tempId,
      message: messageText,
      sender_id: user._id,
      created_at: now,
      message_type: "text",
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      console.log("Sending message:", messageText);

      const result = await sendMessage({
        variables: {
          input: {
            room_id: roomId,
            message: messageText,
          },
        },
      });

      console.log("Message sent to GraphQL mutation");

      // Remove optimistic message
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));

      // Immediately refresh to get the real message
      setTimeout(() => {
        performAutoRefresh();
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      setMessage(messageText);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // Enhanced message rendering
  const renderMessage = ({ item: msg, index }) => {
    if (!msg || !msg._id || !msg.message) {
      console.warn("Invalid message data:", msg);
      return null;
    }

    const isOwnMessage = msg.sender_id === user?._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            msg.isOptimistic && styles.optimisticMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {String(msg.message || "")}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {msg.created_at
              ? (() => {
                  try {
                    return new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch (error) {
                    return "";
                  }
                })()
              : ""}
          </Text>
        </View>
      </View>
    );
  };

  // Show loading state
  if (loading && isInitialLoad) {
    return (
      <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerSubtitle}>Loading...</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getConnectionStatusColor = () => {
    if (isAutoRefreshing) {
      return "rgba(255, 255, 0, 0.9)";
    }

    switch (connectionStatus) {
      case "connected":
        return "rgba(255, 255, 255, 0.8)";
      case "connecting":
        return "rgba(255, 255, 255, 0.6)";
      case "fallback":
        return "rgba(255, 255, 0, 0.8)";
      case "disconnected":
      case "error":
        return "rgba(255, 100, 100, 0.8)";
      default:
        return "rgba(255, 255, 255, 0.8)";
    }
  };

  // Manual refresh with visual feedback
  const handleManualRefresh = async () => {
    console.log("Manual refresh triggered");
    await performAutoRefresh();
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
          <Text
            style={[
              styles.headerSubtitle,
              { color: getConnectionStatusColor() },
            ]}
          ></Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => {
            if (item && item._id) {
              return item._id;
            }
            return `message_${index}_${Date.now()}`;
          }}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
          onLayout={() => scrollToBottom()}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          )}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
              editable={!sendingMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || sendingMessage) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 44 : 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  refreshButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  rotatingIcon: {
    transform: [{ rotate: "360deg" }],
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: "#FE7A3A",
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optimisticMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: "#999",
    textAlign: "left",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F8F9FA",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: "#FE7A3A",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#CCC",
  },
});

export default ChatRoomScreen;
