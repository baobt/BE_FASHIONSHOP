import express from 'express'
import { loginUser, registerUser,adminLogin, getUserProfile, updateUserProfile, updateWishlist, getUserWishlist } from '../controllers/userController.js'
import auth from '../middleware/auth.js'

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/admin',adminLogin)
userRouter.post('/profile', auth, getUserProfile)
userRouter.post('/update-profile', auth, updateUserProfile)
userRouter.post('/wishlist', auth, updateWishlist)
userRouter.post('/get-wishlist', auth, getUserWishlist)

// Email verification routes temporarily disabled
// userRouter.post('/verify-email', verifyEmail)
// userRouter.post('/resend-verification', resendVerificationCode)
// userRouter.post('/forgot-password', forgotPassword)
// userRouter.post('/reset-password', resetPassword)

export default userRouter
