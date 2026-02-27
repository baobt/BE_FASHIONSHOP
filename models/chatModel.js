import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chatConversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId (users) and String (admin)
        required: true
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['user', 'admin']
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, { timestamps: true });

const chatConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        default: null // For future admin assignment
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'waiting'],
        default: 'waiting'
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    unreadCount: {
        user: { type: Number, default: 0 },
        admin: { type: Number, default: 0 }
    },
    userInfo: {
        name: String,
        email: String
    }
}, { timestamps: true });

// Indexes for better performance
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatConversationSchema.index({ userId: 1 });
chatConversationSchema.index({ status: 1, lastMessageTime: -1 });

const chatMessageModel = mongoose.model.chatMessage || mongoose.model('chatMessage', chatMessageSchema);
const chatConversationModel = mongoose.model.chatConversation || mongoose.model('chatConversation', chatConversationSchema);

export { chatMessageModel, chatConversationModel };
