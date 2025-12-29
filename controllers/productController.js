import {v2 as cloudinary} from "cloudinary"
import productModel from "../models/productsModels.js"

//function for add product
const addProduct = async(req,res) => {
    try{
        const {name,description, price, category, subCategory, sizes, sizeStocks, bestseller} = req.body
        
        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1,image2,image3,image4].filter((item)=> item !== undefined)

        let imageUrl = await Promise.all(
            images.map(async (item)=>{
                let result = await cloudinary.uploader.upload(item.path,{resource_type:'image'})
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            category,
            price:Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true :false,
            sizes: JSON.parse(sizes),
            sizeStocks: JSON.parse(sizeStocks),
            image: imageUrl,
            date: Date.now()
        }

       console.log(productData)

       const product = new productModel(productData)
       await product.save()
        
        res.json({success:true, message:" product added"})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
       
    }



}

//function for list product
const listProduct = async (req,res) => {
    try{
        const product = await productModel.find({}).sort({ date: -1 }) // Sort by newest first
        res.json({success:true,product})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//function for add product
const removeProduct = async (req,res) => {
    try{

        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true, message:"Product removed"})

    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//function for single product info
const singleProduct = async(req,res) => {
    try{

        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true, product})

    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }


}

//function for update product
const updateProduct = async(req,res) => {
    try{
        const { id, price } = req.body

        const product = await productModel.findByIdAndUpdate(id, { price: Number(price) }, { new: true })
        res.json({success:true, message:"Product updated", product})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//function for update stock
const updateStock = async(req,res) => {
    try{
        const { productId, size, stock } = req.body
        console.log('Update stock request:', { productId, size, stock })

        // First, ensure stock object exists
        const existingProduct = await productModel.findById(productId)
        if (!existingProduct) {
            return res.json({success:false, message:"Product not found"})
        }

        // Initialize stock object if it doesn't exist
        if (!existingProduct.sizeStocks) {
            existingProduct.sizeStocks = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
            await existingProduct.save()
            console.log('Initialized sizeStocks object for product')
        }

        // Now update the specific size
        const updateField = `sizeStocks.${size}`
        console.log('Update field:', updateField)

        // Use updateOne first, then findById to ensure we get the updated document
        await productModel.updateOne({ _id: productId }, { $set: { [updateField]: Number(stock) } })
        const product = await productModel.findById(productId)
        console.log('Updated product:', product)
        console.log('sizeStocks field:', product?.sizeStocks)

        console.log('Sending response with product:', product)
        console.log('Product stock in response:', product?.stock)
        res.json({success:true, message:"Stock updated", product})
    }catch(error){
        console.log('Update stock error:', error)
        res.json({success:false,message:error.message})
    }
}

export {addProduct,removeProduct,singleProduct,listProduct, updateProduct, updateStock}
