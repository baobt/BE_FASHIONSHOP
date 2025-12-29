import validator from "validator"
import userModel from "../models/userModel.js   "
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"
import crypto from 'crypto'
import { sendVerificationEmail, sendPasswordResetCodeEmail, sendPasswordResetEmail } from '../config/email.js'


const createToken = (id) =>{
    return jwt.sign({id},process.env.JWT_SECRET)
}
//route for user login
const loginUser = async (req,res) => {
    try{

        const {email,password} = req.body;

        const user = await userModel.findOne({email});

        if(!user){
            return res.json({success:false, message:"User doesn't exists"})
        }

        // Check if email is verified
        if(!user.emailVerified){
            return res.json({
                success:false,
                message:"Please verify your email before logging in. Check your email for the verification code.",
                requiresVerification: true,
                email: email
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(isMatch){

            const token = createToken(user._id)
            res.json({success:true, token})

        }

        else{
            res.json({success:false, message:"invalid credentials"})
        }

    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message})

    }
}

//route for user register
const registerUser = async (req,res) => {
    try{

        const {name, email,password} = req.body

        //checking user already exists
        const exists = await userModel.findOne ({email})

        if(exists){
            return res.json({success:false,message:"User already exists"})
        }

        // validation email format & strong password
            if(!validator.isEmail(email)){
                return res.json({success:false, message:"please enter a valid email"})
            }
            if(password.length < 8){
                return res.json({success:false, message:"please enter a strong password"})
            }

            // Generate verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

            //hashing user pass
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password,salt)

            const newUser = new userModel({
                name,
                password:hashedPassword,
                email,
                verificationCode,
                verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            })

            const user = await newUser.save()

            // Send verification email
            try {
                await sendVerificationEmail(email, verificationCode)
                console.log('Verification email sent to:', email)
            } catch (emailError) {
                console.log('Email send error:', emailError)
                // Don't fail registration if email fails, just log it
            }

            const token = createToken(user._id)

            res.json({
                success:true,
                token,
                message: "Registration successful. Please check your email for verification code."
            })

    }catch(error){
        console.log(error);
        res.json({success:false,message:error.message})
    }

}

//route for  admin login
const adminLogin = async (req, res) => {
    try{

        const {email, password} = req.body

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password, process.env.JWT_SECRET)
            res.json({success:true, token})
        }else {
            res.json({success:false, message:"Invalid credentials"})
        }

    }catch(error){
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//route for get user profile
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body

        const user = await userModel.findById(userId).select('name email phone createdAt')

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt
            }
        })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


//route for update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, phone, currentPassword, newPassword } = req.body

        const user = await userModel.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        // Validate name
        if (name && name.trim().length < 2) {
            return res.json({ success: false, message: "Name must be at least 2 characters" })
        }

        // Validate phone
        if (phone && !/^[0-9]{10,11}$/.test(phone)) {
            return res.json({ success: false, message: "Please enter a valid phone number" })
        }

        // Handle password change
        if (newPassword) {
            // Check current password
            if (!currentPassword) {
                return res.json({ success: false, message: "Current password is required" })
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
            if (!isCurrentPasswordValid) {
                return res.json({ success: false, message: "Current password is incorrect" })
            }

            // Validate new password
            if (newPassword.length < 8) {
                return res.json({ success: false, message: "New password must be at least 8 characters" })
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10)
            const hashedNewPassword = await bcrypt.hash(newPassword, salt)
            user.password = hashedNewPassword
        }

        // Update other fields
        if (name) user.name = name.trim()
        if (phone) user.phone = phone.trim()

        await user.save()

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt
            }
        })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//route for add/remove wishlist
const updateWishlist = async (req, res) => {
    try {
        const { userId, productId, action } = req.body

        const user = await userModel.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        if (action === 'add') {
            if (!user.wishlist.includes(productId)) {
                user.wishlist.push(productId)
            }
        } else if (action === 'remove') {
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId)
        }

        await user.save()

        res.json({
            success: true,
            message: action === 'add' ? 'Added to wishlist' : 'Removed from wishlist',
            wishlist: user.wishlist
        })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//route for get user wishlist
const getUserWishlist = async (req, res) => {
    try {
        const { userId } = req.body

        const user = await userModel.findById(userId).populate('wishlist')

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        res.json({
            success: true,
            wishlist: user.wishlist
        })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//route for verify email
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body

        console.log('=== Email Verification Request ===')
        console.log('Email:', email)
        console.log('Code entered:', code)

        // Find user with the email first to see if they exist
        const userExists = await userModel.findOne({ email })
        if (!userExists) {
            console.log('User not found with email:', email)
            return res.json({ success: false, message: "User not found" })
        }

        console.log('User found:', userExists._id)
        console.log('Stored verification code:', userExists.verificationCode)
        console.log('Code expiry:', userExists.verificationCodeExpiry)
        console.log('Current time:', new Date())
        console.log('Is expired?', userExists.verificationCodeExpiry < Date.now())

        // Check if codes match
        const codesMatch = userExists.verificationCode === code
        console.log('Codes match:', codesMatch)

        const user = await userModel.findOne({
            email,
            verificationCode: code,
            verificationCodeExpiry: { $gt: Date.now() }
        })

        if (!user) {
            console.log('No user found with matching criteria')
            return res.json({ success: false, message: "Invalid or expired verification code" })
        }

        console.log('Verification successful for user:', user._id)

        user.emailVerified = true
        user.verificationCode = undefined
        user.verificationCodeExpiry = undefined
        await user.save()

        res.json({ success: true, message: "Email verified successfully" })

    } catch (error) {
        console.log('Verify email error:', error);
        res.json({ success: false, message: error.message })
    }
}

//route for resend verification code
const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        if (user.emailVerified) {
            return res.json({ success: false, message: "Email already verified" })
        }

        // Generate new verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

        user.verificationCode = verificationCode
        user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        await user.save()

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationCode)
            console.log('Verification email resent to:', email)
        } catch (emailError) {
            console.log('Email send error:', emailError)
            return res.json({ success: false, message: "Failed to send email" })
        }

        res.json({ success: true, message: "Verification code sent to your email" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//route for forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        // Generate reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

        user.resetPasswordToken = resetCode
        user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        await user.save()

        // Send password reset email
        try {
            await sendPasswordResetCodeEmail(email, resetCode)
            console.log('Password reset email sent to:', email)
        } catch (emailError) {
            console.log('Email send error:', emailError)
            return res.json({ success: false, message: "Failed to send email" })
        }

        res.json({ success: true, message: "Password reset code sent to your email" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//route for reset password
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body

        const user = await userModel.findOne({
            email,
            resetPasswordToken: code,
            resetPasswordExpiry: { $gt: Date.now() }
        })

        if (!user) {
            return res.json({ success: false, message: "Invalid or expired reset code" })
        }

        // Validate new password
        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters" })
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        user.password = hashedPassword
        user.resetPasswordToken = undefined
        user.resetPasswordExpiry = undefined
        await user.save()

        res.json({ success: true, message: "Password reset successfully" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export {loginUser,registerUser,adminLogin, getUserProfile, updateUserProfile, updateWishlist, getUserWishlist, verifyEmail, resendVerificationCode, forgotPassword, resetPassword}
