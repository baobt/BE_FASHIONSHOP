import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
})

export const sendVerificationEmail = async (email, code) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification - Ecommerce App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Ecommerce App!</h2>
                    <p>Please verify your email address by entering the following code:</p>
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Ecommerce App Team</p>
                </div>
            `
        }

        const result = await transporter.sendMail(mailOptions)
        return result
    } catch (error) {
        console.log('Email send error:', error)
        throw error
    }
}

export const sendPasswordResetCodeEmail = async (email, code) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Code - Ecommerce App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Code</h2>
                    <p>You requested a password reset for your Ecommerce App account.</p>
                    <p>Please use the following code to reset your password:</p>
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Ecommerce App Team</p>
                </div>
            `
        }

        const result = await transporter.sendMail(mailOptions)
        return result
    } catch (error) {
        console.log('Email send error:', error)
        throw error
    }
}

export const sendPasswordResetEmail = async (email, token) => {
    try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset - Ecommerce App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested a password reset for your Ecommerce App account.</p>
                    <p>Please click the link below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>This link will expire in 15 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Ecommerce App Team</p>
                </div>
            `
        }

        const result = await transporter.sendMail(mailOptions)
        return result
    } catch (error) {
        console.log('Email send error:', error)
        throw error
    }
}
