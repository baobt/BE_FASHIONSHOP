import userModel from "../models/userModel.js"
import productModel from "../models/productsModels.js"

//add product to user cart
const addToCart = async (req,res) =>{
    try{

        const{userId, itemId, size} = req.body

        // Check stock - all products must have stock set and not be 0
        const product = await productModel.findById(itemId)
        if(!product || !product.sizeStocks || product.sizeStocks[size] === 0){
            return res.json({success:false, message: "Out of stock"})
        }

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        if(cartData[itemId]){
            if(cartData[itemId][size]){
                cartData[itemId][size] += 1
            }
            else{
                cartData[itemId][size] = 1
            }
        }else {
            cartData[itemId] = {}
            cartData[itemId][size] = 1
        }

        await userModel.findByIdAndUpdate(userId, {cartData})

        res.json({success: true, message:"Added To Cart"})

    }catch(error){
        console.log(error)
        res.json({success:false, message: error.message})
    }
}
//update  user cart
const updateCart = async (req,res) =>{
    try{

        const {userId,itemId,size,quantity} = req.body

        // Check stock availability
        const product = await productModel.findById(itemId)
        if (!product || !product.sizeStocks || product.sizeStocks[size] === 0) {
            return res.json({success:false, message: "Out of stock"})
        }

        if (quantity > product.sizeStocks[size]) {
            return res.json({success:false, message: `Cannot set quantity above available stock`})
        }

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        cartData[itemId][size] = quantity

        await userModel.findByIdAndUpdate(userId, {cartData})
        res.json({success:true, message:"Cart Updated"})

    }catch(error){
        console.log(error)
        res.json({success:false, message: error.message})
    }
}
//get user cart data
const getUserCart = async (req,res) =>{
 try {
    
    const {userId} = req.body

    const userData = await userModel.findById(userId)
    let cartData = await userData.cartData;

    res.json({success:true, cartData})
 } catch (error) {
    console.log(error)
    res.json({success:false, message: error.message})
 }
}

export {addToCart,updateCart,getUserCart}
