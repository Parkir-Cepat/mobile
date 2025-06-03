import React, { useState, useEffect } from 'react';
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
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/authContext';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  GET_ALL_LANDOWNERS,
  GET_USER_CHATS,
  CREATE_PRIVATE_ROOM,
  SEND_MESSAGE,
  DELETE_ROOM
} from '../apollo/chat';

const ChatScreen = ({ navigation, onClose }) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');

  // Get landowner contacts
  const {
    data: landownersData,
    loading: landownersLoading,
    error: landownersError
  } = useQuery(GET_ALL_LANDOWNERS);

  // Get user's existing chats
  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError
  } = useQuery(GET_USER_CHATS);
  // Mutations
  const [createPrivateRoom] = useMutation(CREATE_PRIVATE_ROOM, {
    refetchQueries: [{ query: GET_USER_CHATS }],
  });
  const [sendMessage] = useMutation(SEND_MESSAGE);
  const [deleteRoom] = useMutation(DELETE_ROOM, {
    refetchQueries: [{ query: GET_USER_CHATS }],
  });

  // Get filtered contacts based on user role
  const landowners = landownersData?.getUsersByRole.filter(owner => 
    owner && owner._id && owner.role === 'landowner'
  ) || [];

  const chats = chatsData?.getMyRooms || [];

  // Remove duplicate rooms based on participants
  const uniqueChats = chats.filter((chat, index, self) => {
    const otherParticipant = chat.participants.find(p => p._id !== user?._id);
    return index === self.findIndex(c => {
      const otherP = c.participants.find(p => p._id !== user?._id);
      return otherP?._id === otherParticipant?._id;
    });
  });
  // Filter based on role and search
  const isLandowner = user?.role === 'landowner';
  const filteredContacts = isLandowner 
    ? uniqueChats.filter(chat => {
        const otherParticipant = chat.participants.find(p => p._id !== user?._id);
        return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               otherParticipant?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : landowners.filter(landowner => {
        // Check if already has a chat with this landowner
        const hasExistingChat = uniqueChats.some(chat => {
          const otherParticipant = chat.participants.find(p => p._id !== user?._id);
          return otherParticipant?._id === landowner._id;
        });
        
        const matchesSearch = landowner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             landowner.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch && !hasExistingChat;
      });

  const handleContactPress = async (landowner) => {
    try {
      // Check if room already exists
      const existingRoom = uniqueChats.find(chat => {
        const otherParticipant = chat.participants.find(p => p._id !== user?._id);
        return otherParticipant?._id === landowner._id;
      });

      if (existingRoom) {
        navigation.navigate('ChatRoomScreen', {
          roomId: existingRoom._id,
          contactName: landowner.name
        });
        return;
      }

      const response = await createPrivateRoom({
        variables: {
          input: {
            participant_id: landowner._id
          }
        }
      });

      if (response.data?.createPrivateRoom) {
        navigation.navigate('ChatRoomScreen', {
          roomId: response.data.createPrivateRoom._id,
          contactName: landowner.name
        });
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };
  const handleChatPress = (chat) => {
    navigation.navigate('ChatRoomScreen', {
      roomId: chat._id,
      contactName: chat.participants.find(p => p._id !== user?._id)?.name
    });
  };

  const handleDeleteChat = (chat) => {
    const otherParticipant = chat.participants.find(p => p._id !== user?._id);
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete the chat with ${otherParticipant?.name || 'this user'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoom({
                variables: { roomId: chat._id }
              });
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat');
            }
          },
        },
      ]
    );
  };

  const SwipeableChatItem = ({ chat }) => {
    const translateX = new Animated.Value(0);
    const otherParticipant = chat.participants.find(p => p._id !== user?._id);
    const lastMessage = chat.last_message;

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -40) {
          Animated.timing(translateX, {
            toValue: -80,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    });

    return (
      <View style={styles.swipeContainer}>
        <Animated.View
          style={[
            styles.chatItem,
            {
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.chatContent}
            onPress={() => handleChatPress(chat)}
          >
            <View style={styles.chatAvatar}>
              <Text style={styles.avatarText}>
                {otherParticipant?.name?.charAt(0)?.toUpperCase() || ''}
              </Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{otherParticipant?.name || chat.name || ''}</Text>
              {lastMessage && (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {lastMessage.message || ''}
                </Text>
              )}
            </View>
            {chat.participant_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{chat.participant_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteChat(chat)}
        >
          <Ionicons name="trash" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };
  const renderContactItem = ({ item }) => {
    const contactInfo = isLandowner 
      ? item.participants.find(p => p._id !== user?._id)
      : item;

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => isLandowner ? handleChatPress(item) : handleContactPress(contactInfo)}
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.avatarText}>
            {contactInfo?.name?.charAt(0)?.toUpperCase() || ''}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contactInfo?.name || ''}</Text>
          <Text style={styles.contactRole}>
            {isLandowner ? 'User' : 'Landowner'}
          </Text>
        </View>
        <View>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>
    );
  };
  const renderChatItem = ({ item: chat }) => {
    return <SwipeableChatItem chat={chat} />;
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Messages</Text>
      </LinearGradient>      {/* Tab Buttons - Show only if user is not a landowner */}
      {!isLandowner && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'chats' && styles.activeTab]}
            onPress={() => setSelectedTab('chats')}
          >
            <Text style={[styles.tabText, selectedTab === 'chats' && styles.activeTabText]}>
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'contacts' && styles.activeTab]}
            onPress={() => setSelectedTab('contacts')}
          >
            <Text style={[styles.tabText, selectedTab === 'contacts' && styles.activeTabText]}>
              Landowners
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />        <TextInput
          style={styles.searchInput}
          placeholder={isLandowner ? "Search messages..." : (selectedTab === 'chats' ? "Search chats..." : "Search landowners...")}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>      {/* Content */}
      {isLandowner ? (
        // Landowner view - only shows chats
        <FlatList
          data={filteredContacts}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            chatsLoading ? (
              <ActivityIndicator style={styles.loader} color="#FE7A3A" />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No messages yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Users will appear here when they contact you
                </Text>
              </View>
            )
          }
        />
      ) : selectedTab === 'contacts' ? (
        // User view - contacts tab
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            landownersLoading ? (
              <ActivityIndicator style={styles.loader} color="#FE7A3A" />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No landowners found</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            chatsLoading ? (
              <ActivityIndicator style={styles.loader} color="#FE7A3A" />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No chats yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start a conversation with a landowner
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FE7A3A',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FE7A3A',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D97706',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#FE7A3A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default ChatScreen;
