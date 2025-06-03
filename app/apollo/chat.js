import { gql } from '@apollo/client';

// Resolvers for Chat
const resolvers = {
  Query: {
    getContacts: (_, __, { client }) => {
      // Implementation for getting contacts
    },
    getChats: (_, __, { client }) => {
      // Implementation for getting chats
    },
    getChatMessages: (_, { chatId }, { client }) => {
      // Implementation for getting messages in a chat
    },
  },
  Mutation: {
    createChat: (_, { userId }, { client }) => {
      // Implementation for creating a new chat
    },
    sendMessage: (_, { input }, { client }) => {
      // Implementation for sending a message
    },
  },
};

export { resolvers };

// Queries
export const GET_ALL_LANDOWNERS = gql`
  query GetAllLandowners {
    getUsersByRole(role: "landowner") {
      _id
      name
      email
      role
      avatar
    }
  }
`;

export const GET_USER_CHATS = gql`
  query GetUserChats {
    getMyRooms {
      _id
      name
      participants {
        _id
        name
        email
      }
      last_message {
        message
        created_at
      }
      participant_count
    }
  }
`;

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($roomId: ID!) {
    getRoomMessages(room_id: $roomId) {
      _id
      message
      sender_id
      created_at
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount {
    getUnreadCount
  }
`;

// Mutations
export const CREATE_PRIVATE_ROOM = gql`
  mutation CreatePrivateRoom($input: CreatePrivateRoomInput!) {
    createPrivateRoom(input: $input) {
      _id
      participants {
        _id
        name
        email
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      _id
      message
      sender_id
      created_at
    }
  }
`;

export const DELETE_ROOM = gql`
  mutation DeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`;

// Subscriptions
export const ROOM_UPDATED = gql`
  subscription RoomUpdated($userId: ID!) {
    roomUpdated(userId: $userId) {
      _id
      name
      participants {
        _id
        name
        email
      }
      last_message {
        message
        created_at
      }
      participant_count
    }
  }
`;

export const MESSAGE_SENT = gql`
  subscription MessageReceived($roomId: ID!) {
    messageReceived(room_id: $roomId) {
      _id
      message
      sender_id
      created_at
    }
  }
`;
