// Email verification disabled until domain is owned
// import { Resend } from 'resend'

// const resend = new Resend(process.env.RESEND_API_KEY)

export const sendVerificationEmail = async (email, code) => {
    // Temporarily disabled - requires owned domain
    console.log('Email verification disabled - sendVerificationEmail called but not executed')
    return { disabled: true, message: 'Email verification temporarily disabled' }

    /*
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Ecommerce App <onboarding@resend.dev>',
            to: [email],
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
        })

        if (error) {
            console.log('Resend email error:', error)
            throw error
        }

        return data
    } catch (error) {
        console.log('Email send error:', error)
        throw error
    }
    */
}

export const sendPasswordResetCodeEmail = async (email, code) => {
    // Temporarily disabled - requires owned domain
    console.log('Email verification disabled - sendPasswordResetCodeEmail called but not executed')
    return { disabled: true, message: 'Email verification temporarily disabled' }

    /*
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Ecommerce App <noreply@resend.dev>',
            to: [email],
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
        })

        if (error) {
            console.log('Resend email error:', error)
            throw error
        }

        return data
    } catch (error) {
        console.log('Email send error:', error)
        throw error
    }
    */
}

export const sendPasswordResetEmail = async (email, token) => {
    // Temporarily disabled - requires owned domain
    console.log('Email verification disabled - sendPasswordResetEmail called but not executed')
    return { disabled: true, message: 'Email verification temporarily disabled' }

    /*
    try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Ecommerce App <noreply@resend.dev>',
            to: [email],
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
        })

        if (error) {
            console.log('Resend email error:', error)
            throw error
        }

        return data
    } catch (error) {
        console.log('Email send error:', error)
        throw error
    }
    */
}
