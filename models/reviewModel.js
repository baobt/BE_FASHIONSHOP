import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    productId: {type: String, required: true},
    orderId: {type: String}, // Optional - can be set later
    rating: {type: Number, required: true, min: 1, max: 5},
    comment: {type: String, required: true},
    date: {type: Number, required: true},
    userName: {type: String, required: true},
    adminReply: {type: String},
    adminReplyDate: {type: Number}
})

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema)

export default reviewModel
