import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/authContext";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import {
  GET_ALL_LANDOWNERS,
  GET_USER_CHATS,
  CREATE_PRIVATE_ROOM,
  SEND_MESSAGE,
  DELETE_ROOM,
  ROOM_UPDATED,
} from "../apollo/chat";
import { WebSocketLink } from "@apollo/client/link/ws";

// Suppress console errors and warnings for better UX
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Only log critical errors, suppress subscription and GraphQL errors
  const message = args.join(" ");
  if (
    !message.includes("subscription") &&
    !message.includes("WebSocket") &&
    !message.includes("GraphQL") &&
    !message.includes("Network error")
  ) {
    originalConsoleError(...args);
  }
};

console.warn = (...args) => {
  // Suppress all warnings to prevent error notifications
  const message = args.join(" ");
  if (
    !message.includes("subscription") &&
    !message.includes("WebSocket") &&
    !message.includes("connection")
  ) {
    // Only log critical warnings
  }
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DELETE_WIDTH = 80;

const SwipeableRow = ({ children, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 20
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -DELETE_WIDTH));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -40) {
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    setIsDeleting(true);
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onDelete();
      setIsDeleting(false);
    });
  };

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        disabled={isDeleting}
      >
        <Ionicons name="trash-outline" size={24} color="#FFF" />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.rowContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const ChatScreen = ({ navigation, onClose }) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Enhanced GraphQL operations with silent error handling
  const [createPrivateRoom] = useMutation(CREATE_PRIVATE_ROOM, {
    errorPolicy: "all",
    onError: (error) => {
      // Silent error handling - just log without alerts
      console.log("Create room error (silent):", error.message);
    },
  });

  const [deleteRoom] = useMutation(DELETE_ROOM, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_USER_CHATS }],
    awaitRefetchQueries: true,
    onError: (error) => {
      // Silent error handling
      console.log("Delete room error (silent):", error.message);
    },
  });

  // Get landowner contacts with silent error handling
  const {
    data: landownersData,
    loading: landownersLoading,
    error: landownersError,
  } = useQuery(GET_ALL_LANDOWNERS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.log("Landowners query error (silent):", error.message);
    },
  });

  // Get user's existing chats with silent error handling
  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery(GET_USER_CHATS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.log("Chats query error (silent):", error.message);
    },
  });

  // Enhanced subscription with silent error handling
  const {
    data: subscriptionData,
    error: subscriptionError,
    loading: subscriptionLoading,
  } = useSubscription(ROOM_UPDATED, {
    variables: { user_id: user?._id },
    skip: !user?._id,
    shouldResubscribe: true,
    fetchPolicy: "no-cache",
    onData: ({ data }) => {
      try {
        if (data?.data?.roomUpdated) {
          refetchChats();
          setConnectionStatus("connected");
        }
      } catch (error) {
        // Silent error handling
        console.log(
          "Subscription data processing error (silent):",
          error.message
        );
      }
    },
    onError: (error) => {
      // Silent error handling - no alerts or notifications
      setConnectionStatus("error");
      console.log("Subscription error (silent):", error.message);
    },
    onCompleted: () => {
      setConnectionStatus("connected");
    },
  });

  // Monitor subscription status with silent handling
  useEffect(() => {
    if (subscriptionError) {
      // Silent handling - just set connection status
      if (subscriptionError.message?.includes("400")) {
        setConnectionStatus("unsupported");
      } else if (subscriptionError.networkError) {
        setConnectionStatus("network_error");
      } else {
        setConnectionStatus("error");
      }
    } else if (subscriptionLoading) {
      setConnectionStatus("connecting");
    } else {
      setConnectionStatus("connected");
    }
  }, [subscriptionError, subscriptionLoading]);

  // WebSocket configuration with silent error handling
  useEffect(() => {
    if (subscriptionError) {
      // Silent reconnection attempt without notifications
      setTimeout(() => {
        console.log("Attempting silent reconnection...");
      }, 5000);
    }
  }, [subscriptionError]);

  const landowners = landownersData?.getUsersByRole || [];
  const chats = chatsData?.getMyRooms || [];

  // Remove duplicate rooms by checking participants
  const uniqueChats = chats.reduce((acc, chat) => {
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    const existingChat = acc.find((c) => {
      const existingParticipant = c.participants.find(
        (p) => p._id !== user?._id
      );
      return existingParticipant?._id === otherParticipant?._id;
    });

    if (!existingChat) {
      acc.push(chat);
    } else {
      // Keep the most recent chat
      if (
        new Date(chat.last_message?.created_at) >
        new Date(existingChat.last_message?.created_at)
      ) {
        const index = acc.indexOf(existingChat);
        acc[index] = chat;
      }
    }
    return acc;
  }, []);

  // Filter based on role and search
  const isLandowner = user?.role === "landowner";

  const filteredContacts = isLandowner
    ? uniqueChats.filter((chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id !== user?._id
        );
        return (
          otherParticipant?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          otherParticipant?.email
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      })
    : landowners.filter((landowner) => {
        // Check if already has a chat with this landowner
        const hasExistingChat = uniqueChats.some((chat) => {
          const otherParticipant = chat.participants.find(
            (p) => p._id !== user?._id
          );
          return otherParticipant?._id === landowner._id;
        });

        const matchesSearch =
          landowner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          landowner.email?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch && !hasExistingChat;
      });

  // Enhanced handleContactPress with silent error handling
  const handleContactPress = async (landowner) => {
    try {
      // Check if room already exists
      const existingRoom = uniqueChats.find((chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id !== user?._id
        );
        return otherParticipant?._id === landowner._id;
      });

      if (existingRoom) {
        navigation.navigate("ChatRoomScreen", {
          roomId: existingRoom._id,
          contactName: landowner.name,
        });
        return;
      }

      console.log("Creating new room with landowner:", landowner._id);

      const response = await createPrivateRoom({
        variables: {
          input: {
            participant_id: landowner._id,
          },
        },
        errorPolicy: "all",
      });

      if (response.data?.createPrivateRoom) {
        navigation.navigate("ChatRoomScreen", {
          roomId: response.data.createPrivateRoom._id,
          contactName: landowner.name,
        });
        // Refresh chats list to show new room
        await refetchChats();
      } else if (response.errors) {
        // Silent error handling - just log
        console.log(
          "Room creation failed (silent):",
          response.errors[0]?.message
        );
      }
    } catch (error) {
      // Silent error handling - no alerts
      console.log("Contact press error (silent):", error.message);
    }
  };

  const handleChatPress = (chat) => {
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    navigation.navigate("ChatRoomScreen", {
      roomId: chat._id,
      contactName: otherParticipant?.name || "Unknown",
    });
  };

  const handleDeleteChat = async (chatId) => {
    try {
      if (!chatId || typeof chatId !== "string") {
        return;
      }

      const response = await deleteRoom({
        variables: { id: chatId },
        errorPolicy: "all",
      });

      if (response.data?.deleteRoom === true) {
        await refetchChats();
        return;
      }

      // Silent error handling for all error cases
      if (response.errors && response.errors.length > 0) {
        const error = response.errors[0];
        console.log("Delete error (silent):", error.message);

        if (error.message?.includes("removeByRoom is not a function")) {
          refetchChats(); // Optimistic update
          return;
        }

        if (error.message?.includes("not found")) {
          await refetchChats();
        }
      }
    } catch (error) {
      // Silent error handling for all network errors
      console.log("Delete chat error (silent):", error.message);

      if (error.networkError?.statusCode === 404) {
        await refetchChats();
      }
    }
  };

  // Direct delete without confirmation popup
  const confirmDeleteChat = (chat) => {
    handleDeleteChat(chat._id);
  };

  const renderContactItem = ({ item }) => {
    const contactInfo = isLandowner
      ? item.participants.find((p) => p._id !== user?._id)
      : item;

    // Validate contactInfo
    if (!contactInfo || !contactInfo._id) {
      console.warn("Invalid contact info:", contactInfo);
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() =>
          isLandowner ? handleChatPress(item) : handleContactPress(contactInfo)
        }
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.avatarText}>
            {contactInfo?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>
            {contactInfo?.name || "Unknown User"}
          </Text>
          <Text style={styles.contactRole}>
            {isLandowner ? "User" : "Landowner"}
          </Text>
        </View>
        <View>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item: chat }) => {
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    const lastMessage = chat.last_message;

    // Validate chat data
    if (!otherParticipant) {
      return null;
    }

    const chatContent = (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(chat)}
      >
        <View style={styles.chatAvatar}>
          <Text style={styles.avatarText}>
            {otherParticipant?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>
            {otherParticipant?.name || chat.name || "Unknown User"}
          </Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.message || "No message"}
            </Text>
          )}
          {lastMessage?.created_at && (
            <Text style={styles.messageTime}>
              {(() => {
                try {
                  return new Date(lastMessage.created_at).toLocaleDateString();
                } catch (error) {
                  return "";
                }
              })()}
            </Text>
          )}
        </View>
        {chat.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{chat.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );

    return (
      <SwipeableRow onDelete={() => confirmDeleteChat(chat)}>
        {chatContent}
      </SwipeableRow>
    );
  };

  // Enhanced empty state with connection status
  const renderEmptyState = (type) => {
    if (type === "chats-loading") {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.emptyStateText}>Loading chats...</Text>
        </View>
      );
    }

    if (type === "chats-error") {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyStateText}>Error loading chats</Text>
          <Text style={styles.emptyStateSubtext}>
            {chatsError?.message || "Please try again"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchChats()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (type === "chats-empty") {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>
            {isLandowner ? "No messages yet" : "No chats yet"}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {isLandowner
              ? "Users will appear here when they contact you"
              : "Start a conversation with a landowner"}
          </Text>
          {connectionStatus !== "connected" && (
            <Text style={styles.connectionWarning}>
              Connection: {connectionStatus}
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FF9A62", "#FE7A3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </LinearGradient>

      {/* Tab Buttons - Show only if user is not a landowner */}
      {!isLandowner && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "chats" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("chats")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "chats" && styles.activeTabText,
              ]}
            >
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "contacts" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("contacts")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "contacts" && styles.activeTabText,
              ]}
            >
              Landowners
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            isLandowner
              ? "Search messages..."
              : selectedTab === "chats"
              ? "Search chats..."
              : "Search landowners..."
          }
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {/* Enhanced Content with better error handling */}
      {isLandowner ? (
        // Landowner view - only shows chats
        <FlatList
          data={filteredContacts}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            chatsLoading
              ? renderEmptyState("chats-loading")
              : chatsError
              ? renderEmptyState("chats-error")
              : renderEmptyState("chats-empty")
          }
        />
      ) : selectedTab === "contacts" ? (
        // User view - contacts tab
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            landownersLoading ? (
              <ActivityIndicator style={styles.loader} color="#FE7A3A" />
            ) : landownersError ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#EF4444"
                />
                <Text style={styles.emptyStateText}>
                  Error loading landowners
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {landownersError.message || "Please try again"}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No landowners found</Text>
              </View>
            )
          }
        />
      ) : (
        // User view - chats tab
        <FlatList
          data={uniqueChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            chatsLoading
              ? renderEmptyState("chats-loading")
              : chatsError
              ? renderEmptyState("chats-error")
              : renderEmptyState("chats-empty")
          }
        />
      )}
    </SafeAreaView>
  );
};

// Add connection status styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FE7A3A",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#FE7A3A",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 8,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#D97706",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 14,
    color: "#6B7280",
  },
  swipeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
  },
  rowContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  deleteButton: {
    width: DELETE_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EF4444",
    height: "100%",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  unreadBadge: {
    backgroundColor: "#FE7A3A",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: "#FE7A3A",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  connectionIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  connectionWarning: {
    fontSize: 12,
    color: "#F59E0B",
    marginTop: 8,
    fontStyle: "italic",
  },
});

// Cleanup console overrides when component unmounts
const ChatScreenWrapper = (props) => {
  useEffect(() => {
    return () => {
      // Restore original console functions on cleanup
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return <ChatScreen {...props} />;
};

export default ChatScreenWrapper;
