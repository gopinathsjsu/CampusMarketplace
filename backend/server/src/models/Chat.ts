import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  product?: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage?: IMessage;
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addMessage(
    senderId: mongoose.Types.ObjectId,
    content: string
  ): Promise<IChat>;
  markMessagesAsRead(userId: mongoose.Types.ObjectId): Promise<IChat>;
}

export interface IChatModel extends mongoose.Model<IChat> {
  findOrCreateChat(
    buyerId: mongoose.Types.ObjectId,
    sellerId: mongoose.Types.ObjectId,
    productId?: mongoose.Types.ObjectId
  ): Promise<IChat>;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: [true, "Message content is required"],
    trim: true,
    maxlength: [1000, "Message cannot exceed 1000 characters"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    messages: [messageSchema],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
// Note: participants index removed - was causing issues with participant order
chatSchema.index({ product: 1 });
chatSchema.index({ lastActivity: -1 });
// Note: We ensure unique participant pairs in the application logic (findOrCreateChat)
// rather than with a DB index, since array order matters for MongoDB unique indexes

// Virtual for last message
chatSchema.virtual("lastMessage").get(function () {
  return this.messages.length > 0
    ? this.messages[this.messages.length - 1]
    : null;
});

// Virtual for unread message count per participant
chatSchema.virtual("unreadCount").get(function () {
  const counts: { [key: string]: number } = {};

  this.participants.forEach((participantId: mongoose.Types.ObjectId) => {
    const participantIdStr = participantId.toString();
    counts[participantIdStr] = this.messages.filter(
      (msg: IMessage) =>
        !msg.isRead && msg.sender.toString() !== participantIdStr
    ).length;
  });

  return counts;
});

// Method to add a message
chatSchema.methods.addMessage = function (
  senderId: mongoose.Types.ObjectId,
  content: string
) {
  const message = {
    sender: senderId,
    content: content.trim(),
    timestamp: new Date(),
    isRead: false,
  };

  this.messages.push(message);
  this.lastActivity = new Date();
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markMessagesAsRead = function (
  userId: mongoose.Types.ObjectId
) {
  this.messages.forEach((message: IMessage) => {
    if (message.sender.toString() !== userId.toString()) {
      message.isRead = true;
    }
  });
  return this.save();
};

// Static method to find or create chat
chatSchema.statics.findOrCreateChat = async function (
  buyerId: mongoose.Types.ObjectId,
  sellerId: mongoose.Types.ObjectId,
  productId?: mongoose.Types.ObjectId
) {
  // Sort participants to ensure consistent order (smaller ID first)
  // This prevents duplicate chats with reversed participant order
  const sortedParticipants = [buyerId, sellerId].sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );

  // First, check if ANY chat already exists between these two users (regardless of product)
  // This ensures we return the existing chat instead of trying to create a duplicate
  // We check both sorted and unsorted orders for backwards compatibility
  let chat = await this.findOne({
    $or: [
      { participants: { $all: [buyerId, sellerId], $size: 2 } },
      { participants: sortedParticipants },
    ],
  })
    .populate(
      "participants",
      "userName profilePicture firstName lastName avatar role"
    )
    .populate("product", "title price images status");

  if (chat) {
    // If found chat has participants in wrong order, fix it
    const currentOrder = chat.participants
      .map((p: any) => p._id.toString())
      .join("-");
    const correctOrder = sortedParticipants
      .map((p: any) => p.toString())
      .join("-");

    if (currentOrder !== correctOrder) {
      chat.participants = sortedParticipants;
      await chat.save();
      // Re-populate after save
      await chat.populate(
        "participants",
        "userName profilePicture firstName lastName avatar role"
      );
    }

    return chat;
  }

  // Try to create new chat with sorted participants
  try {
    const chatData: any = {
      participants: sortedParticipants,
      messages: [],
    };

    // Only include product if provided
    if (productId) {
      chatData.product = productId;
    }

    chat = await this.create(chatData);

    await chat.populate(
      "participants",
      "userName profilePicture firstName lastName avatar role"
    );
    await chat.populate("product", "title price images status");

    return chat;
  } catch (error: any) {
    // If duplicate key error (chat was created between our check and create),
    // fetch and return the existing chat
    if (error.code === 11000 || error.message?.includes("duplicate")) {
      chat = await this.findOne({
        $or: [
          { participants: { $all: [buyerId, sellerId], $size: 2 } },
          { participants: sortedParticipants },
        ],
      })
        .populate(
          "participants",
          "userName profilePicture firstName lastName avatar role"
        )
        .populate("product", "title price images status");

      if (chat) {
        return chat;
      }

      // If still no chat found, it's a real error
      console.error("Duplicate key error but no existing chat found:", error);
    }
    // If it's not a duplicate error or we couldn't find the chat, throw the error
    throw error;
  }
};

export default mongoose.model<IChat, IChatModel>("Chat", chatSchema);
