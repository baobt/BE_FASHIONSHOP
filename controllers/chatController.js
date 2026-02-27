import { chatMessageModel, chatConversationModel } from '../models/chatModel.js'
import userModel from '../models/userModel.js'

// Get or create conversation for user
const getOrCreateConversation = async (req, res) => {
    try {
        const { userId } = req.body

        // Verify user exists
        const user = await userModel.findById(userId)
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        // Check if conversation already exists
        let conversation = await chatConversationModel.findOne({ userId })

        if (!conversation) {
            // Create new conversation
            conversation = new chatConversationModel({
                userId,
                userInfo: {
                    name: user.name,
                    email: user.email
                }
            })
            await conversation.save()
        }

        res.json({
            success: true,
            conversation: {
                _id: conversation._id,
                status: conversation.status,
                lastMessage: conversation.lastMessage,
                lastMessageTime: conversation.lastMessageTime,
                unreadCount: conversation.unreadCount
            }
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Get conversation messages
const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.body
        const { userId } = req.body // From auth middleware

        // Verify conversation belongs to user
        const conversation = await chatConversationModel.findOne({
            _id: conversationId,
            userId
        })

        if (!conversation) {
            return res.json({ success: false, message: 'Conversation not found' })
        }

        // Get messages
        const messages = await chatMessageModel.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate({
                path: 'senderId',
                select: 'name email',
                // Only populate if it's an ObjectId (user), not string (admin)
                match: { $type: "objectId" }
            })
            .select('message messageType senderModel isRead createdAt')

        // Mark messages as read for user
        await chatMessageModel.updateMany(
            { conversationId, senderModel: 'admin', isRead: false },
            { isRead: true, readAt: new Date() }
        )

        // Reset user's unread count
        conversation.unreadCount.user = 0
        await conversation.save()

        res.json({
            success: true,
            messages: messages.map(msg => ({
                _id: msg._id,
                message: msg.message,
                messageType: msg.messageType,
                senderModel: msg.senderModel,
                isRead: msg.isRead,
                createdAt: msg.createdAt,
                senderName: msg.senderModel === 'admin'
                    ? 'Admin'
                    : msg.senderId?.name || 'Unknown'
            }))
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Send message
const sendMessage = async (req, res) => {
    try {
        const { conversationId, message, messageType = 'text' } = req.body
        const { userId } = req.body // From auth middleware

        // Verify conversation belongs to user
        const conversation = await chatConversationModel.findOne({
            _id: conversationId,
            userId
        })

        if (!conversation) {
            return res.json({ success: false, message: 'Conversation not found' })
        }

        // Create message
        const newMessage = new chatMessageModel({
            conversationId,
            senderId: userId,
            senderModel: 'user',
            message,
            messageType
        })

        await newMessage.save()

        // Update conversation
        conversation.lastMessage = message
        conversation.lastMessageTime = new Date()
        conversation.unreadCount.admin += 1
        await conversation.save()

        res.json({
            success: true,
            message: {
                _id: newMessage._id,
                message: newMessage.message,
                messageType: newMessage.messageType,
                senderModel: 'user',
                isRead: false,
                createdAt: newMessage.createdAt,
                senderName: 'You'
            }
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Mark messages as read
const markMessagesRead = async (req, res) => {
    try {
        const { conversationId } = req.body
        const { userId } = req.body // From auth middleware

        // Verify conversation belongs to user
        const conversation = await chatConversationModel.findOne({
            _id: conversationId,
            userId
        })

        if (!conversation) {
            return res.json({ success: false, message: 'Conversation not found' })
        }

        // Mark messages as read
        await chatMessageModel.updateMany(
            { conversationId, senderModel: 'admin', isRead: false },
            { isRead: true, readAt: new Date() }
        )

        // Reset unread count
        conversation.unreadCount.user = 0
        await conversation.save()

        res.json({ success: true, message: 'Messages marked as read' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ADMIN FUNCTIONS

// Get all conversations for admin
const getAllConversations = async (req, res) => {
    try {
        const conversations = await chatConversationModel.find()
            .populate('userId', 'name email')
            .sort({ lastMessageTime: -1 })
            .select('_id status lastMessage lastMessageTime unreadCount userInfo createdAt')

        res.json({
            success: true,
            conversations: conversations.map(conv => ({
                _id: conv._id,
                status: conv.status,
                lastMessage: conv.lastMessage,
                lastMessageTime: conv.lastMessageTime,
                unreadCount: conv.unreadCount,
                userInfo: {
                    name: conv.userId?.name || conv.userInfo?.name,
                    email: conv.userId?.email || conv.userInfo?.email
                },
                createdAt: conv.createdAt
            }))
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Get conversation messages for admin
const getConversationMessagesAdmin = async (req, res) => {
    try {
        const { conversationId } = req.body

        const conversation = await chatConversationModel.findById(conversationId)
        if (!conversation) {
            return res.json({ success: false, message: 'Conversation not found' })
        }

        const messages = await chatMessageModel.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate({
                path: 'senderId',
                select: 'name email',
                // Only populate if it's an ObjectId (user), not string (admin)
                match: { $type: "objectId" }
            })
            .select('message messageType senderModel isRead createdAt')

        // Mark messages as read for admin
        await chatMessageModel.updateMany(
            { conversationId, senderModel: 'user', isRead: false },
            { isRead: true, readAt: new Date() }
        )

        // Reset admin's unread count
        conversation.unreadCount.admin = 0
        await conversation.save()

        res.json({
            success: true,
            messages: messages.map(msg => ({
                _id: msg._id,
                message: msg.message,
                messageType: msg.messageType,
                senderModel: msg.senderModel,
                isRead: msg.isRead,
                createdAt: msg.createdAt,
                senderName: msg.senderModel === 'admin'
                    ? 'Admin'
                    : msg.senderId?.name || 'Unknown'
            }))
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Send message as admin
const sendMessageAdmin = async (req, res) => {
    try {
        const { conversationId, message, messageType = 'text' } = req.body

        const conversation = await chatConversationModel.findById(conversationId)
        if (!conversation) {
            return res.json({ success: false, message: 'Conversation not found' })
        }

        // Create message
        const newMessage = new chatMessageModel({
            conversationId,
            senderId: req.body.adminId || 'admin', // Will be set by admin auth middleware
            senderModel: 'admin',
            message,
            messageType
        })

        await newMessage.save()

        // Update conversation
        conversation.lastMessage = message
        conversation.lastMessageTime = new Date()
        conversation.status = 'active'
        conversation.unreadCount.user += 1
        await conversation.save()

        res.json({
            success: true,
            message: {
                _id: newMessage._id,
                message: newMessage.message,
                messageType: newMessage.messageType,
                senderModel: 'admin',
                isRead: false,
                createdAt: newMessage.createdAt,
                senderName: 'Admin'
            }
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Update conversation status
const updateConversationStatus = async (req, res) => {
    try {
        const { conversationId, status } = req.body

        const conversation = await chatConversationModel.findById(conversationId)
        if (!conversation) {
            return res.json({ success: false, message: 'Conversation not found' })
        }

        conversation.status = status
        await conversation.save()

        res.json({
            success: true,
            message: `Conversation status updated to ${status}`
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    getOrCreateConversation,
    getConversationMessages,
    sendMessage,
    markMessagesRead,
    getAllConversations,
    getConversationMessagesAdmin,
    sendMessageAdmin,
    updateConversationStatus
}
