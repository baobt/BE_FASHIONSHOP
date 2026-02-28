import express from 'express'
import {
    getOrCreateConversation,
    getConversationMessages,
    sendMessage,
    markMessagesRead,
    getAllConversations,
    getConversationMessagesAdmin,
    sendMessageAdmin,
    updateConversationStatus,
    deleteConversation
} from '../controllers/chatController.js'
import auth from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'

const chatRouter = express.Router()

// User routes (require authentication)
chatRouter.post('/get-conversation', auth, getOrCreateConversation)
chatRouter.post('/get-messages', auth, getConversationMessages)
chatRouter.post('/send-message', auth, sendMessage)
chatRouter.post('/mark-read', auth, markMessagesRead)

// Admin routes (require admin authentication)
chatRouter.post('/admin/conversations', adminAuth, getAllConversations)
chatRouter.post('/admin/messages', adminAuth, getConversationMessagesAdmin)
chatRouter.post('/admin/send-message', adminAuth, sendMessageAdmin)
chatRouter.post('/admin/update-status', adminAuth, updateConversationStatus)
chatRouter.post('/admin/delete-conversation', adminAuth, deleteConversation)

export default chatRouter
