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
  const flatListRef = useRef();

  // Enhanced query with better error handling
  const { data, loading, error, refetch } = useQuery(GET_CHAT_MESSAGES, {
    variables: { roomId },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
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

          setMessages(sortedMessages);
          setIsInitialLoad(false);
          setConnectionStatus("connected");

          // Auto scroll to bottom after initial load
          setTimeout(() => {
            scrollToBottom();
          }, 200);
        } catch (error) {
          console.error("Error processing messages:", error);
          setMessages([]);
          setIsInitialLoad(false);
        }
      } else {
        setMessages([]);
        setIsInitialLoad(false);
      }
    },
    onError: (error) => {
      console.error("Query error:", error);
      setIsInitialLoad(false);
      setConnectionStatus("error");
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

  // Enhanced subscription with robust error handling
  const {
    data: primarySubscriptionData,
    error: primarySubscriptionError,
    loading: primarySubscriptionLoading,
  } = useSubscription(MESSAGE_RECEIVED, {
    variables: { room_id: roomId },
    skip: !roomId || !user?._id,
    shouldResubscribe: true,
    fetchPolicy: "no-cache",
    errorPolicy: "all",
    onData: ({ data: subscriptionPayload }) => {
      console.log("PRIMARY MESSAGE_RECEIVED:", subscriptionPayload);

      try {
        const newMessage = subscriptionPayload?.data?.messageReceived;
        if (newMessage && newMessage._id) {
          handleIncomingMessage(newMessage);
        }
      } catch (error) {
        console.error("Error processing primary subscription:", error);
      }
    },
    onError: (error) => {
      console.error("PRIMARY subscription error:", error);
      setConnectionStatus("primary_failed");
    },
    onCompleted: () => {
      console.log("PRIMARY subscription established");
      setConnectionStatus("connected");
    },
  });

  // Fallback subscription
  const { data: fallbackSubscriptionData, error: fallbackSubscriptionError } =
    useSubscription(MESSAGE_SENT, {
      variables: { room_id: roomId },
      skip: !roomId || !user?._id || !primarySubscriptionError,
      shouldResubscribe: true,
      fetchPolicy: "no-cache",
      errorPolicy: "all",
      onData: ({ data: subscriptionPayload }) => {
        console.log("FALLBACK MESSAGE_SENT:", subscriptionPayload);

        try {
          const newMessage = subscriptionPayload?.data?.messageSent;
          if (newMessage && newMessage._id) {
            handleIncomingMessage(newMessage);
          }
        } catch (error) {
          console.error("Error processing fallback subscription:", error);
        }
      },
      onError: (error) => {
        console.error("FALLBACK subscription error:", error);
        setConnectionStatus("both_failed");
      },
      onCompleted: () => {
        console.log("FALLBACK subscription established");
        setConnectionStatus("fallback_connected");
      },
    });

  // Enhanced message handler
  const handleIncomingMessage = useCallback(
    (newMessage) => {
      if (!newMessage || !newMessage._id || !newMessage.message) {
        console.warn("Invalid message received:", newMessage);
        return;
      }

      console.log("Processing incoming message:", newMessage.message);

      const processedMessage = {
        ...newMessage,
        created_at: newMessage.created_at || new Date().toISOString(),
        message: String(newMessage.message || ""),
        sender_id:
          newMessage.sender_id || newMessage.user_id || newMessage.sender?._id,
      };

      setMessages((prevMessages) => {
        // Check if message already exists
        const messageExists = prevMessages.some(
          (msg) => msg._id === processedMessage._id
        );

        if (!messageExists) {
          console.log("Adding new message to state:", processedMessage.message);
          const updatedMessages = [...prevMessages, processedMessage].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          // Auto scroll to bottom
          setTimeout(() => scrollToBottom(), 100);
          return updatedMessages;
        }

        console.log("Message already exists, skipping:", processedMessage._id);
        return prevMessages;
      });

      setConnectionStatus("connected");
    },
    [scrollToBottom]
  );

  // Enhanced connection status monitoring
  useEffect(() => {
    if (primarySubscriptionError && fallbackSubscriptionError) {
      console.error("Both subscriptions failed:", {
        primary: primarySubscriptionError,
        fallback: fallbackSubscriptionError,
      });
      setConnectionStatus("disconnected");

      // Show user-friendly error after multiple failures
      if (primarySubscriptionError.networkError?.statusCode === 400) {
        console.error("WebSocket not supported or misconfigured");
        // Fallback to polling
        startPolling();
      }
    } else if (primarySubscriptionError && !fallbackSubscriptionError) {
      console.log("Using fallback subscription");
      setConnectionStatus("fallback");
    } else if (!primarySubscriptionError) {
      setConnectionStatus("connected");
    }
  }, [primarySubscriptionError, fallbackSubscriptionError]);

  // Polling fallback for when WebSocket fails
  const startPolling = useCallback(() => {
    console.log("Starting polling fallback mechanism");
    setConnectionStatus("polling");

    const pollingInterval = setInterval(async () => {
      try {
        console.log("Polling for new messages");
        await refetch();
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(pollingInterval);
    };
  }, [refetch]);

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

      // Remove optimistic message when real message is received
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove optimistic message and restore input on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      setMessage(messageText);
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

  // Connection status indicator
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Connecting...";
      case "connected":
        return user?.role === "landowner" ? "User" : "Landowner";
      case "fallback":
        return "Connected (Fallback)";
      case "fallback_connected":
        return "Connected (Secondary)";
      case "primary_failed":
        return "Connecting (Fallback)";
      case "both_failed":
        return "Connection issues";
      case "polling":
        return "Connected (Polling)";
      case "disconnected":
        return "Disconnected";
      case "error":
        return "Connection error";
      default:
        return "Unknown status";
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
      case "fallback_connected":
        return "rgba(255, 255, 255, 0.8)";
      case "connecting":
      case "primary_failed":
        return "rgba(255, 255, 255, 0.6)";
      case "fallback":
      case "polling":
        return "rgba(255, 255, 0, 0.8)";
      case "both_failed":
      case "disconnected":
      case "error":
        return "rgba(255, 100, 100, 0.8)";
      default:
        return "rgba(255, 255, 255, 0.8)";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced header with better connection status */}
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
          >
            {getConnectionStatusText()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            console.log("Manual refresh triggered");
            refetch();
          }}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Show connection warning if needed */}
      {(connectionStatus === "both_failed" ||
        connectionStatus === "polling") && (
        <View style={styles.connectionWarning}>
          <Ionicons name="warning-outline" size={16} color="#F59E0B" />
          <Text style={styles.connectionWarningText}>
            {connectionStatus === "polling"
              ? "Real-time messaging unavailable. Using polling mode."
              : "Connection issues detected. Messages may be delayed."}
          </Text>
        </View>
      )}

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
            if (item?._id) return item._id;
            return `${index}-${item?.message?.substring(0, 10) || "unknown"}-${
              item?.created_at || Date.now()
            }`;
          }}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyMessagesList,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={() => {
            if (isInitialLoad && messages.length > 0) {
              setTimeout(scrollToBottom, 100);
            }
          }}
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyMessagesContainer}>
              <Text style={styles.emptyMessagesText}>No messages yet</Text>
              <Text style={styles.emptyMessagesSubtext}>
                Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sendingMessage) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sendingMessage}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() && !sendingMessage ? "#FFFFFF" : "#A1A1AA"}
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 40 : 10,
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
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  emptyMessagesList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: "row",
  },
  ownMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: "#FE7A3A",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#1F2937",
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: "#6B7280",
  },
  optimisticMessage: {
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
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
    backgroundColor: "#FE7A3A",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },
  connectionWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#F59E0B",
  },
  connectionWarningText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#D97706",
    flex: 1,
  },
});

export default ChatRoomScreen;
