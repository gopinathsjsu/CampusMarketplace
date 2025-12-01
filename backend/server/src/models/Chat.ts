import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  product: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage?: IMessage;
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addMessage(senderId: mongoose.Types.ObjectId, content: string): Promise<IChat>;
  markMessagesAsRead(userId: mongoose.Types.ObjectId): Promise<IChat>;
}

export interface IChatModel extends mongoose.Model<IChat> {
  findOrCreateChat(
    buyerId: mongoose.Types.ObjectId,
    sellerId: mongoose.Types.ObjectId,
    productId: mongoose.Types.ObjectId
  ): Promise<IChat>;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new Schema<IChat>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  messages: [messageSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ product: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ 'participants': 1, 'product': 1 }, { unique: true });

// Virtual for last message
chatSchema.virtual('lastMessage').get(function() {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Virtual for unread message count per participant
chatSchema.virtual('unreadCount').get(function() {
  const counts: { [key: string]: number } = {};
  
  this.participants.forEach((participantId: mongoose.Types.ObjectId) => {
    const participantIdStr = participantId.toString();
    counts[participantIdStr] = this.messages.filter(
      (msg: IMessage) => !msg.isRead && msg.sender.toString() !== participantIdStr
    ).length;
  });
  
  return counts;
});

// Method to add a message
chatSchema.methods.addMessage = function(senderId: mongoose.Types.ObjectId, content: string) {
  const message = {
    sender: senderId,
    content: content.trim(),
    timestamp: new Date(),
    isRead: false
  };
  
  this.messages.push(message);
  this.lastActivity = new Date();
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markMessagesAsRead = function(userId: mongoose.Types.ObjectId) {
  this.messages.forEach((message: IMessage) => {
    if (message.sender.toString() !== userId.toString()) {
      message.isRead = true;
    }
  });
  return this.save();
};

// Static method to find or create chat
chatSchema.statics.findOrCreateChat = async function(
  buyerId: mongoose.Types.ObjectId,
  sellerId: mongoose.Types.ObjectId,
  productId: mongoose.Types.ObjectId
) {
  let chat = await this.findOne({
    participants: { $all: [buyerId, sellerId] },
    product: productId
  }).populate('participants', 'userName profilePicture firstName lastName avatar')
    .populate('product', 'title price images');

  if (!chat) {
    chat = await this.create({
      participants: [buyerId, sellerId],
      product: productId,
      messages: []
    });
    
    await chat.populate('participants', 'userName profilePicture firstName lastName avatar');
    await chat.populate('product', 'title price images');
  }

  return chat;
};

export default mongoose.model<IChat, IChatModel>('Chat', chatSchema);
