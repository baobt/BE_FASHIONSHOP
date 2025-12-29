import express from 'express'
import {
    getDashboardOverview,
    getRevenueChart,
    getTopProducts,
    getRecentOrders,
    syncSalesCount,
    getBestSellers
} from '../controllers/analyticsController.js'
import adminAuth from '../middleware/adminAuth.js'

const analyticsRouter = express.Router()

// Admin routes
analyticsRouter.get('/overview', adminAuth, getDashboardOverview)
analyticsRouter.get('/revenue-chart', adminAuth, getRevenueChart)
analyticsRouter.get('/top-products', adminAuth, getTopProducts)
analyticsRouter.get('/recent-orders', adminAuth, getRecentOrders)
analyticsRouter.post('/sync-sales-count', adminAuth, syncSalesCount)

// Public routes for frontend
analyticsRouter.get('/best-sellers', getBestSellers)

export default analyticsRouter
