import { User, Conversation, Message } from '@prisma/client';

export type UserPublic = Omit<User, 'email' | 'password' | 'updatedAt'>;

export type CreateUserInput = {
  firstName: string;
  lastName?: string | null;
  email: string;
  password: string;
  imgUrl?: string | null;
  about?: string | null;
};

export type UserUpdateInput = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

export type MessageWithReadBy = Message & {
  readBy: UserPublic[];
};

export type ConversationWithMessagesAndUsers = Conversation & {
  users: UserPublic[];
  admins: UserPublic[];
  messages: MessageWithReadBy[];
};

export type CreateConversationInput = {
  name: string | null;
  imgUrl: string | null;
  isGroup: boolean;
  adminIds: number[];
  userIds: number[];
};

export type ConversationWithMostRecentMessages = Omit<
  ConversationWithMessagesAndUsers,
  'admins'
>;

export type ConversationUpdateTitleAndImageInput = Partial<
  Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'isGroup'>
>;

export type ConversationWithUsersAndAdmins = Omit<
  ConversationWithMessagesAndUsers,
  'messages'
>;

export type UpdateMessageInput = Partial<
  Omit<
    Message,
    'id' | 'createdAt' | 'updatedAt' | 'senderId' | 'conversationId'
  >
>;