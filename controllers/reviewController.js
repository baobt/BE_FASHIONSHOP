import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productsModels.js";

// Add review for a product
const addReview = async (req, res) => {
    try {
        const { userId, productId, rating, comment, userName } = req.body;

        // Check if user already reviewed this product
        const existingReview = await reviewModel.findOne({
            userId,
            productId
        });

        if (existingReview) {
            return res.json({ success: false, message: "You have already reviewed this product" });
        }

        const reviewData = {
            userId,
            productId,
            orderId: null, 
            rating: Number(rating),
            comment,
            userName,
            date: Date.now()
        };

        const review = new reviewModel(reviewData);
        await review.save();

        res.json({ success: true, message: "Review added successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get reviews for a specific product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.body;

        const reviews = await reviewModel.find({ productId }).sort({ date: -1 });

        res.json({ success: true, reviews });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all reviews for admin
const getAllReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.find({}).sort({ date: -1 });
        console.log('Found reviews:', reviews.length);

        // Populate product info manually to handle missing products
        const populatedReviews = await Promise.all(
            reviews.map(async (review) => {
                try {
                    console.log('Looking for product:', review.productId);
                    // Try to find the product
                    const product = await productModel.findById(review.productId).select('name image');
                    console.log('Found product:', product?.name, product?.image?.[0]);

                    return {
                        ...review.toObject(),
                        productId: product || { name: 'Product Deleted', image: ['/placeholder-image.png'] }
                    };
                } catch (error) {
                    console.log('Product lookup error:', error);
                    // If product not found, return with placeholder
                    return {
                        ...review.toObject(),
                        productId: { name: 'Product Deleted', image: ['/placeholder-image.png'] }
                    };
                }
            })
        );

        console.log('Sending reviews with populated products');
        res.json({ success: true, reviews: populatedReviews });

    } catch (error) {
        console.log('getAllReviews error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Admin reply to review
const adminReplyReview = async (req, res) => {
    try {
        const { reviewId, reply } = req.body;

        await reviewModel.findByIdAndUpdate(reviewId, {
            adminReply: reply,
            adminReplyDate: Date.now()
        });

        res.json({ success: true, message: "Reply added successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addReview, getProductReviews, getAllReviews, adminReplyReview }
