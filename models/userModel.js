import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    cartData: { type: Object, default: {} },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'product' }],
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date }
}, { minimize: false, timestamps: true })

const userModel = mongoose.model.user || mongoose.model('user', userSchema)

export default userModel
