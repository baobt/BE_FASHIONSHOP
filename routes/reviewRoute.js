import express from 'express'
import { addReview, getProductReviews, getAllReviews, adminReplyReview } from '../controllers/reviewController.js'
import authUser from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'

const reviewRouter = express.Router()

// User routes
reviewRouter.post('/add', authUser, addReview)
reviewRouter.post('/product', getProductReviews)

// Admin routes
reviewRouter.get('/all', adminAuth, getAllReviews)
reviewRouter.post('/admin-reply', adminAuth, adminReplyReview)

export default reviewRouter
