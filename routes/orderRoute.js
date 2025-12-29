import express from 'express'
import {placeOrder,placeOrderMomo,placeOrderPaypal,allOrders,userOrders,updateStatus,markAsPaid,cancelOrder, momoCallback} from '../controllers/ordersController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'


const orderRouter = express.Router()

//admin Features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)
orderRouter.post('/mark-paid', adminAuth, markAsPaid)

//Payment Features
orderRouter.post('/place',authUser, placeOrder)
orderRouter.post('/paypal',authUser, placeOrderPaypal)
orderRouter.post('/momo',authUser, placeOrderMomo)
orderRouter.post('/momo/callback', momoCallback)

//User Feature
orderRouter.post('/userorders',authUser,userOrders)
orderRouter.post('/cancel',authUser,cancelOrder)

export default orderRouter
