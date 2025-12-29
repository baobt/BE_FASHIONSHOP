import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    image: {type: Array, required: true},
    category: {type: String, required: true},
    subCategory: {type: String, required: true},
    sizes: { type: Array, required: true },
    sizeStocks: {
        S: { type: Number, default: 0 },
        M: { type: Number, default: 0 },
        L: { type: Number, default: 0 },
        XL: { type: Number, default: 0 },
        XXL: { type: Number, default: 0 }
    },
    salesCount: {type: Number, default: 0},
    bestseller: {type: Boolean},
    date: {type: Number, required: true}
})

const productModel = mongoose.model.product || mongoose.model("product", productSchema)

export default productModel
