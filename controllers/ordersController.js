import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import productModel from "../models/productsModels.js"
import axios from 'axios'
import crypto from 'crypto'


//Placing orders using COD Method
const placeOrder = async (req, res) => {

    try {

        const { userId, items, amount, address } = req.body

        // Check stock before placing order - all products must have stock set
        for (const item of items) {
            const product = await productModel.findById(item._id)
            if (!product || (product.sizeStocks && product.sizeStocks[item.size] === 0) || (!product.sizeStocks)) {
                return res.json({ success: false, message: `Insufficient stock for ${product?.name} size ${item.size}` })
            }
            if (product.sizeStocks && product.sizeStocks[item.size] !== undefined && product.sizeStocks[item.size] < item.quantity) {
                return res.json({ success: false, message: `Insufficient stock for ${product?.name} size ${item.size}` })
            }
        }

        // Reduce stock
        for (const item of items) {
            if (item.quantity > 0) {
                await productModel.findByIdAndUpdate(item._id, {
                    $inc: { [`sizeStocks.${item.size}`]: -item.quantity }
                })
            }
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "COD",
            payment: 'false',
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.json({ success: true, message: "Order Placed" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

//Placing orders using Paypal Method
const placeOrderPaypal = async (req, res) => {
    try {

        const { userId, items, amount, address } = req.body

        // Check stock before placing order - all products must have stock set
        for (const item of items) {
            const product = await productModel.findById(item._id)
            if (!product || (product.sizeStocks && product.sizeStocks[item.size] === 0) || (!product.sizeStocks)) {
                return res.json({ success: false, message: `Insufficient stock for ${product?.name} size ${item.size}` })
            }
            if (product.sizeStocks && product.sizeStocks[item.size] !== undefined && product.sizeStocks[item.size] < item.quantity) {
                return res.json({ success: false, message: `Insufficient stock for ${product?.name} size ${item.size}` })
            }
        }

        // Reduce stock and increase sales count
        for (const item of items) {
            await productModel.findByIdAndUpdate(item._id, {
                $inc: {
                    [`sizeStocks.${item.size}`]: -item.quantity,
                    salesCount: item.quantity
                }
            })
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "PayPal",
            payment: true,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.json({ success: true, message: "Order Placed with PayPal" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


//Placing orders using Momo Method
const placeOrderMomo = async (req, res) => {
    try {
        console.log('=== MoMo Payment Request ===');
        console.log('Request Body:', req.body);

        const { userId, items, amount, address } = req.body;

        // Check stock before placing order - all products must have stock set
        for (const item of items) {
            const product = await productModel.findById(item._id)
            if (!product || (product.sizeStocks && product.sizeStocks[item.size] === 0) || (!product.sizeStocks)) {
                return res.json({ success: false, message: `Insufficient stock for ${product?.name} size ${item.size}` })
            }
            if (product.sizeStocks && product.sizeStocks[item.size] !== undefined && product.sizeStocks[item.size] < item.quantity) {
                return res.json({ success: false, message: `Insufficient stock for ${product?.name} size ${item.size}` })
            }
        }

        // Generate unique orderId before calling MoMo
        const timestamp = Date.now();
        const orderId = `ORDER_${userId}_${timestamp}`;
        const requestId = `REQ_${userId}_${timestamp}`;

        // MoMo config
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const endpoint = process.env.MOMO_ENDPOINT;
        const redirectUrl = process.env.MOMO_REDIRECT_URL;
        const ipnUrl = process.env.MOMO_IPN_URL;

        const orderInfo = encodeURIComponent("Payment for Ecommerce Order");
        const amountStr = Math.round(amount).toString();
        const requestType = "captureWallet";
        const extraData = "";

        // Create raw signature (MoMo server expected order)
        const rawSignature =
            `accessKey=${accessKey}` +
            `&amount=${amountStr}` +
            `&extraData=${extraData}` +
            `&ipnUrl=${ipnUrl}` +
            `&orderId=${orderId}` +
            `&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}` +
            `&redirectUrl=${redirectUrl}` +
            `&requestId=${requestId}` +
            `&requestType=${requestType}`
        const signature = crypto
            .createHmac("sha256", secretKey)
            .update(rawSignature)
            .digest("hex");

        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount: amountStr, // ✅ Đã là string - fix lỗi chính
            orderId,
            orderInfo, // ⚠️ dùng bản encode
            redirectUrl,
            ipnUrl,
            requestType,
            extraData,
            signature,
            lang: "en",
        };
        console.log('MoMo Request Body:', requestBody);
        console.log('MoMo Raw Signature:', rawSignature);
        console.log('MoMo Computed Signature:', signature);

        const response = await axios.post(endpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('MoMo Response:', response.data);

        if (response.data.resultCode === 0) {
            // Success - create order and return payUrl
            const orderData = {
                _id: orderId, // Use generated orderId
                userId,
                items,
                address,
                amount,
                paymentMethod: "MoMo",
                payment: false,
                date: Date.now()
            };

            const newOrder = new orderModel(orderData);
            await newOrder.save();

            // Reduce stock and increase sales count
            for (const item of items) {
                await productModel.findByIdAndUpdate(item._id, {
                    $inc: {
                        [`sizeStocks.${item.size}`]: -item.quantity,
                        salesCount: item.quantity
                    }
                })
            }

            await userModel.findByIdAndUpdate(userId, { cartData: {} });
            console.log('Order created after MoMo success:', orderId);
            res.json({ success: true, payUrl: response.data.payUrl, message: "MoMo payment initiated" });
        } else {
            // Failure - no order created
            console.log('MoMo Payment Failed:', response.data);
            res.json({ success: false, message: "MoMo payment creation failed: " + response.data.message });
        }
    } catch (error) {
        console.log("MoMo Error:", error.response?.data || error.message);
        console.log("MoMo Error Status:", error.response?.status);
        console.log("MoMo Error Response Body:", error.response?.data);
        console.log("MoMo Error Headers:", error.response?.headers);

        // No order to delete since it's created only on success

        res.status(400).json({
            success: false,
            message: error.response?.data?.message || error.message
        });
    }
}

//Auto archive shipped orders after 2 days
const autoArchiveOrders = async () => {
    try {
        const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days in milliseconds

        const ordersToArchive = await orderModel.find({
            status: 'Shipped',
            archived: false,
            date: { $lt: twoDaysAgo }
        })

        if (ordersToArchive.length > 0) {
            await orderModel.updateMany(
                {
                    status: 'Shipped',
                    archived: false,
                    date: { $lt: twoDaysAgo }
                },
                {
                    archived: true,
                    archivedAt: Date.now()
                }
            )
            console.log(`Auto-archived ${ordersToArchive.length} orders`)
        }
    } catch (error) {
        console.log('Auto archive error:', error)
    }
}

//All order data for admin panel
const allOrders = async (req, res) => {
    try {
        // Run auto archive first
        await autoArchiveOrders()

        const { page = 1, limit = 10 } = req.body
        const skip = (page - 1) * limit

        // Get paginated orders
        const orders = await orderModel
            .find({ archived: false })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)

        // Get total count for pagination
        const totalOrders = await orderModel.countDocuments({ archived: false })

        res.json({
            success: true,
            orders,
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit)
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


//All order data for Frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body

        const activeOrders = await orderModel.find({ userId, archived: false }).sort({ date: -1 })
        const archivedOrders = await orderModel.find({ userId, archived: true }).sort({ date: -1 })

        res.json({
            success: true,
            activeOrders,
            archivedOrders
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


//All order status
const updateStatus = async (req, res) => {
    try {

        const { orderId, status } = req.body

        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.json({ success: false, message: 'Order not found' })
        }

        // Handle sales count for COD orders when status changes to Delivered
        if (status === 'Delivered' && order.paymentMethod === 'COD' && !order.payment) {
            // Mark as paid and increase sales count when order is delivered
            await orderModel.findByIdAndUpdate(orderId, {
                status,
                payment: true
            })

            // Increase sales count for COD orders when delivered
            for (const item of order.items) {
                if (item.quantity > 0) {
                    await productModel.findByIdAndUpdate(item._id, {
                        $inc: { salesCount: item.quantity }
                    })
                }
            }
        } else {
            // Just update status for other cases
            await orderModel.findByIdAndUpdate(orderId, { status })
        }

        res.json({ success: true, message: 'Status updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Mark COD order as paid
const markAsPaid = async (req, res) => {
    try {
        const { orderId } = req.body

        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.json({ success: false, message: 'Order not found' })
        }

        if (order.payment) {
            return res.json({ success: false, message: 'Order is already paid' })
        }

        if (order.paymentMethod !== 'COD') {
            return res.json({ success: false, message: 'Only COD orders can be marked as paid manually' })
        }

        // Update order payment status only (sales count is handled when status becomes Delivered)
        await orderModel.findByIdAndUpdate(orderId, { payment: true })

        res.json({ success: true, message: 'Order marked as paid successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Cancel order by user
const cancelOrder = async (req, res) => {
    try {
        console.log('=== Cancel Order Request ===');
        console.log('Request Body:', req.body);

        const { orderId, reason } = req.body;
        const userId = req.body.userId; // From auth middleware

        console.log('OrderId:', orderId, 'UserId:', userId, 'Reason:', reason);

        const order = await orderModel.findById(orderId);

        if (!order) {
            console.log('Order not found:', orderId);
            return res.json({ success: false, message: "Order not found" });
        }

        console.log('Order found:', order._id, 'Status:', order.status, 'PaymentMethod:', order.paymentMethod);

        if (order.userId !== userId) {
            console.log('Unauthorized: Order userId', order.userId, 'vs token userId', userId);
            return res.json({ success: false, message: "Unauthorized" });
        }

        if (order.status !== 'Order Placed') {
            console.log('Cannot cancel: Order status is', order.status);
            return res.json({ success: false, message: "Cannot cancel order. Order has been processed." });
        }

        if (order.paymentMethod !== 'COD') {
            console.log('Cannot cancel: Payment method is', order.paymentMethod);
            return res.json({ success: false, message: "Cannot cancel order. Only COD orders can be cancelled." });
        }

        console.log('Updating order status to Cancelled...');

        // Update order status
        order.status = 'Cancelled';
        order.cancelledReason = reason;
        order.cancelledAt = Date.now();
        order.archived = true; // Move to archived
        order.archivedAt = Date.now();
        await order.save();

        console.log('Order updated successfully, restoring stock...');

        // Restore stock (only size stocks, not sales count - sales count is permanent once recorded)
        for (const item of order.items) {
            if (item.quantity > 0) {
                await productModel.findByIdAndUpdate(item._id, {
                    $inc: {
                        [`sizeStocks.${item.size}`]: item.quantity
                        // Note: salesCount is not decreased - once a sale is recorded, it stays
                    }
                });
                console.log('Restored stock for item:', item._id, 'size:', item.size, 'quantity:', item.quantity, 'salesCount unchanged');
            }
        }

        console.log('Order cancelled successfully');
        res.json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
        console.log('Cancel order error:', error);
        res.json({ success: false, message: error.message });
    }
};

// MoMo IPN Callback
const momoCallback = async (req, res) => {
    try {
        const { partnerCode, accessKey, requestId, amount, orderId, orderInfo, orderType, transId, resultCode, message, responseTime, extraData, signature } = req.body;

        // Verify signature
        const secretKey = process.env.MOMO_SECRET_KEY;
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const computedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        if (signature !== computedSignature) {
            return res.json({ success: false, message: 'Signature invalid' });
        }

        if (resultCode === "0") {
            // Payment successful
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: 'Payment confirmed' });
        } else {
            // Payment failed
            res.json({ success: false, message: message });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { placeOrder, placeOrderMomo, placeOrderPaypal, allOrders, userOrders, updateStatus, markAsPaid, cancelOrder, momoCallback }
