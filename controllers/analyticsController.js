import orderModel from "../models/orderModel.js";
import productModel from "../models/productsModels.js";

// Get dashboard overview
const getDashboardOverview = async (req, res) => {
    try {
        const { period = 'today' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);
                startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        }

        // Get orders in date range
        const orders = await orderModel.find({
            date: { $gte: startDate.getTime(), $lt: endDate.getTime() }
        });

        // Calculate revenue based on payment method and status
        const revenueOrders = orders.filter(order => {
            if (order.paymentMethod === 'COD') {
                // COD: Only count when delivered
                return order.payment && order.status === 'Delivered';
            } else {
                // PayPal/MoMo: Count immediately when paid
                return order.payment;
            }
        });

        const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.amount, 0);

        const totalOrders = orders.length;
        const paidOrders = orders.filter(order => order.payment).length;
        const cancelledOrders = orders.filter(order => order.status === 'Cancelled').length;

        // Get unique customers
        const uniqueCustomers = new Set(orders.map(order => order.userId)).size;

        // Payment method breakdown - only count when actually contributing to revenue
        const paymentMethods = {
            COD: revenueOrders.filter(order => order.paymentMethod === 'COD').length,
            MoMo: revenueOrders.filter(order => order.paymentMethod === 'MoMo').length,
            PayPal: revenueOrders.filter(order => order.paymentMethod === 'PayPal').length
        };

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                paidOrders,
                cancelledOrders,
                uniqueCustomers,
                paymentMethods,
                period
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get revenue chart data
const getRevenueChart = async (req, res) => {
    try {
        const { period = 'daily', range = 'month' } = req.query;

        const now = new Date();
        let startDate, endDate;

        // Set date range
        switch (range) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
        }

        console.log('Revenue Chart - Date range:', startDate.toISOString(), 'to', endDate.toISOString());

        // Get all orders in range
        const orders = await orderModel.find({
            date: { $gte: startDate.getTime(), $lte: endDate.getTime() }
        }).sort({ date: 1 });

        console.log('Revenue Chart - Total orders found:', orders.length);

        // Filter orders based on payment method and status
        const revenueOrders = orders.filter(order => {
            if (order.paymentMethod === 'COD') {
                // COD: Only count when delivered
                const shouldCount = order.payment && order.status === 'Delivered';
                console.log(`COD Order ${order._id}: payment=${order.payment}, status=${order.status}, count=${shouldCount}`);
                return shouldCount;
            } else {
                // PayPal/MoMo: Count immediately when paid
                const shouldCount = order.payment;
                console.log(`Online Order ${order._id}: payment=${order.payment}, method=${order.paymentMethod}, count=${shouldCount}`);
                return shouldCount;
            }
        });

        console.log('Revenue Chart - Revenue orders after filter:', revenueOrders.length);

        // If no revenue orders, create some sample data for demo
        if (revenueOrders.length === 0) {
            console.log('No revenue data found, creating sample chart data');
            const sampleLabels = [];
            const sampleData = [];

            const current = new Date(startDate);
            for (let i = 0; i < 10; i++) {
                if (period === 'daily') {
                    sampleLabels.push(current.toISOString().split('T')[0]);
                    current.setDate(current.getDate() + 1);
                } else if (period === 'weekly') {
                    sampleLabels.push(current.toISOString().split('T')[0]);
                    current.setDate(current.getDate() + 7);
                } else if (period === 'monthly') {
                    sampleLabels.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
                    current.setMonth(current.getMonth() + 1);
                }
                sampleData.push(Math.floor(Math.random() * 1000000) + 100000); // Random revenue
            }

            return res.json({
                success: true,
                data: {
                    labels: sampleLabels,
                    data: sampleData,
                    period,
                    range,
                    isSampleData: true
                }
            });
        }

        // Group by period using filtered revenue orders
        const groupedData = {};
        const labels = [];

        revenueOrders.forEach(order => {
            const orderDate = new Date(order.date);
            let key;

            if (period === 'daily') {
                key = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (period === 'weekly') {
                const weekStart = new Date(orderDate);
                weekStart.setDate(orderDate.getDate() - orderDate.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!groupedData[key]) {
                groupedData[key] = 0;
            }
            groupedData[key] += order.amount;
        });

        // Create continuous labels
        const current = new Date(startDate);
        while (current <= endDate) {
            let key;
            if (period === 'daily') {
                key = current.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const weekStart = new Date(current);
                weekStart.setDate(current.getDate() - current.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            }

            labels.push(key);
            groupedData[key] = groupedData[key] || 0;

            // Increment
            if (period === 'daily') {
                current.setDate(current.getDate() + 1);
            } else if (period === 'weekly') {
                current.setDate(current.getDate() + 7);
            } else if (period === 'monthly') {
                current.setMonth(current.getMonth() + 1);
            }
        }

        const data = labels.map(label => groupedData[label] || 0);

        res.json({
            success: true,
            data: {
                labels,
                data,
                period,
                range
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get top selling products based on salesCount from database
const getTopProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get products with salesCount > 0, sorted by salesCount descending
        const topProducts = await productModel.find({
            salesCount: { $gt: 0 }
        })
        .select('name image price salesCount')
        .sort({ salesCount: -1 })
        .limit(parseInt(limit));

        // Format data to match expected structure
        const formattedProducts = topProducts.map(product => ({
            id: product._id,
            name: product.name,
            image: product.image,
            quantity: product.salesCount,
            revenue: product.price * product.salesCount
        }));

        console.log(`Returning top ${limit} products from database:`, formattedProducts.map(p => ({
            name: p.name,
            quantity: p.quantity,
            revenue: p.revenue
        })));

        res.json({
            success: true,
            data: formattedProducts
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get recent orders
const getRecentOrders = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const orders = await orderModel.find({})
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Sync sales count with actual orders
const syncSalesCount = async (req, res) => {
    try {
        console.log('Starting sales count sync...');

        // Get all orders that contribute to revenue
        const revenueOrders = await orderModel.find({
            payment: true,
            $or: [
                { paymentMethod: { $ne: 'COD' } }, // PayPal/MoMo
                { paymentMethod: 'COD', status: 'Delivered' } // COD delivered
            ]
        });

        console.log(`Found ${revenueOrders.length} revenue-contributing orders`);

        // Calculate sales count for each product
        const salesUpdates = {};

        revenueOrders.forEach(order => {
            console.log(`Processing order ${order._id}: ${order.items.length} items`);
            order.items.forEach(item => {
                if (!salesUpdates[item._id]) {
                    salesUpdates[item._id] = 0;
                }
                salesUpdates[item._id] += item.quantity;
                console.log(`  Product ${item._id} (${item.name}): +${item.quantity} = ${salesUpdates[item._id]}`);
            });
        });

        // Update products
        for (const [productId, quantity] of Object.entries(salesUpdates)) {
            const product = await productModel.findById(productId);
            console.log(`Updating ${product?.name}: ${product?.salesCount || 0} → ${quantity}`);
            await productModel.findByIdAndUpdate(productId, { salesCount: quantity });
        }

        console.log(`Synced sales count for ${Object.keys(salesUpdates).length} products`);

        res.json({
            success: true,
            message: `Synced sales count for ${Object.keys(salesUpdates).length} products from ${revenueOrders.length} orders`
        });

    } catch (error) {
        console.log('Sync error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get top products for frontend (best sellers based on sales count)
const getBestSellers = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get products with salesCount > 0, sorted by salesCount descending
        // Include bestseller products even if salesCount = 0
        const bestSellers = await productModel.find({
            $or: [
                { salesCount: { $gt: 0 } },
                { bestseller: true }
            ]
        })
        .select('name image price salesCount bestseller')
        .sort({ salesCount: -1, bestseller: -1 }) // Sales count first, then bestseller
        .limit(parseInt(limit));

        res.json({
            success: true,
            products: bestSellers
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { getDashboardOverview, getRevenueChart, getTopProducts, getRecentOrders, syncSalesCount, getBestSellers }
