import { PrismaClient, User, Conversation } from '@prisma/client';
import {
  UserPublic,
  CreateUserInput,
  UserUpdateInput,
  MessageWithReadBy,
  ConversationWithMessagesAndUsers,
  CreateConversationInput,
  ConversationWithMostRecentMessages,
  ConversationUpdateTitleAndImageInput,
  ConversationWithUsersAndAdmins,
  UpdateMessageInput,
} from '../utils/types';

const prisma = new PrismaClient();

// USERS
// get all users but without login data (email and password)
export const queryGetUsers = async (): Promise<UserPublic[]> => {
  return await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imgUrl: true,
      about: true,
      createdAt: true,
    },
    orderBy: {
      firstName: 'desc',
    },
  });
};

export const queryGetUsersByName = async (
  name: string
): Promise<UserPublic[]> => {
  return await prisma.user.findMany({
    where: {
      OR: [
        {
          firstName: {
            contains: name,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: name,
            mode: 'insensitive',
          },
        },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imgUrl: true,
      about: true,
      createdAt: true,
    },
    orderBy: {
      firstName: 'desc',
    },
  });
};

export const queryGetUserById = async (id: number): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      imgUrl: true,
      about: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const queryGetUserByEmail = async (
  email: string
): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      imgUrl: true,
      about: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const queryCreateUser = async (data: CreateUserInput): Promise<User> => {
  const { firstName, lastName, email, password, imgUrl, about } = data;
  return await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password,
      imgUrl,
      about,
    },
  });
};

export const queryUpdateUser = async (
  id: number,
  data: UserUpdateInput
): Promise<User | null> => {
  return await prisma.user.update({
    where: {
      id,
    },
    data,
  });
};

export const queryDeleteUser = async (id: number): Promise<void> => {
  await prisma.user.delete({
    where: {
      id,
    },
  });
};


// Conversations
// gets all user conversations with 10 most recent messages
export const queryGetUserConversations = async (
  userId: number
): Promise<ConversationWithMostRecentMessages[]> => {
  return await prisma.conversation.findMany({
    where: {
      users: {
        // Using some in this context allows to filter conversations to include
        // only those where at least one user matches the specified userId
        some: {
          id: userId,
        },
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          readBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imgUrl: true,
              about: true,
              createdAt: true,
            },
          },
        },
        take: 10, // only 10 most recent messages
      },
    },
  });
};

// gets a conversation with all messages
export const queryGetUserConversation = async (
  userId: number,
  conversationId: number
): Promise<ConversationWithMessagesAndUsers | null> => {
  return await prisma.conversation.findUnique({
    // conversation must exists and user must be in this conversation
    where: {
      id: conversationId,
      users: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          readBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imgUrl: true,
              about: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
};

export const queryCreateConversation = async (
  data: CreateConversationInput
): Promise<ConversationWithMessagesAndUsers> => {
  return await prisma.conversation.create({
    data: {
      name: data.name,
      imgUrl: data.imgUrl,
      isGroup: data.isGroup,
      users: {
        // the users field uses the connect method to associate existing users by their IDs
        connect: data.userIds.map((id) => ({ id })),
      },
      admins: {
        connect: data.adminIds.map((id) => ({ id })),
      },
    },
    // this option allows to specify related records to include in the returned object
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      messages: {
        include: {
          readBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imgUrl: true,
              about: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
};

export const queryGetConversationById = async (
  id: number
): Promise<ConversationWithUsersAndAdmins | null> => {
  return await prisma.conversation.findUnique({
    where: {
      id,
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryGetUserConversationById = async (
  userId: number,
  conversationId: number
): Promise<ConversationWithUsersAndAdmins | null> => {
  return await prisma.conversation.findUnique({
    where: {
      id: conversationId,
      users: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryUpdateConversationTitleAndImage = async (
  id: number,
  data: ConversationUpdateTitleAndImageInput
): Promise<Conversation | null> => {
  return await prisma.conversation.update({
    where: {
      id,
    },
    data,
  });
};

export const queryRemoveUserFromGroupConversation = async (
  userId: number,
  conversationId: number
): Promise<ConversationWithUsersAndAdmins | null> => {
  return await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      users: {
        // to disconnect one out of a list of records provide the ID or unique
        // identifier of the record(s) to disconnect
        disconnect: [{ id: userId }],
      },
      admins: {
        disconnect: [{ id: userId }],
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryAddUserToGroupConversation = async (
  userId: number,
  conversationId: number
): Promise<ConversationWithUsersAndAdmins | null> => {
  return await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      users: {
        connect: [{ id: userId }],
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryGrantUserAdminStatus = async (
  adminId: number,
  conversationId: number
): Promise<ConversationWithUsersAndAdmins | null> => {
  return await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      admins: {
        connect: [{ id: adminId }],
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryRemoveUserAdminStatus = async (
  adminId: number,
  conversationId: number
): Promise<ConversationWithUsersAndAdmins | null> => {
  return await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      admins: {
        disconnect: [{ id: adminId }],
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryDeleteConversation = async (id: number) => {
  await prisma.conversation.delete({
    where: {
      id,
    },
  });
};

// MESSAGES
export const queryGetMessage = async (
  id: number
): Promise<MessageWithReadBy | null> => {
  return prisma.message.findUnique({
    where: {
      id,
    },
    include: {
      readBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryCreateMessage = async (
  userId: number,
  conversationId: number,
  text: string | null,
  imgUrl: string | null
): Promise<MessageWithReadBy> => {
  return await prisma.message.create({
    data: {
      text,
      imgUrl,
      senderId: userId,
      conversationId,
      readBy: {
        connect: [{ id: userId }],
      },
    },
    include: {
      readBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryUpdateMessage = async (
  messageId: number,
  data: UpdateMessageInput
): Promise<MessageWithReadBy> => {
  return await prisma.message.update({
    where: {
      id: messageId,
    },
    data,
    include: {
      readBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imgUrl: true,
          about: true,
          createdAt: true,
        },
      },
    },
  });
};

export const queryMarkMessagesAsRead = async (
  userId: number,
  messageIds: number[]
): Promise<MessageWithReadBy[]> => {
  const updatedMessages = await Promise.all(
    messageIds.map(async (messageId: number) => {
      const updatedMessage = await prisma.message.update({
        where: {
          id: messageId,
        },
        data: {
          readBy: {
            connect: [{ id: userId }],
          },
        },
        include: {
          readBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imgUrl: true,
              about: true,
              createdAt: true,
            },
          },
        },
      });
      return updatedMessage;
    })
  );
  return updatedMessages;
};