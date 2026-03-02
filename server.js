import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import reviewRouter from './routes/reviewRoute.js'
import analyticsRouter from './routes/analyticsRoute.js'
import chatRouter from './routes/chatRoute.js'

//app config

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            
            if (!origin) return callback(null, true)

            
            const allowedOrigins = [
                'http://localhost:5173',  
                'http://localhost:5174',  
                /^https:\/\/.*\.vercel\.app$/,  
                /^https:\/\/.*\.onrender\.com$/   
            ]

            
            const isAllowed = allowedOrigins.some(allowed => {
                if (typeof allowed === 'string') {
                    return allowed === origin
                } else if (allowed instanceof RegExp) {
                    return allowed.test(origin)
                }
                return false
            })

            if (isAllowed) {
                return callback(null, true)
            }

            console.log('Socket CORS blocked origin:', origin)
            return callback(new Error('Not allowed by CORS'))
        },
        credentials: true
    }
})

const port = process.env.PORT || 4000
connectDB()
connectCloudinary()


// middle
app.use(express.json())
app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
    credentials: true
}))

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/review', reviewRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/chat', chatRouter)

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`)
        console.log(`User ${userId} joined room`)
    })

    // Join admin room
    socket.on('join_admin', () => {
        socket.join('admin_room')
        console.log('Admin joined room')
    })

    // Handle new message from user
    socket.on('send_message', async (data) => {
        try {
            const { conversationId, message, userId } = data

            // Broadcast to admin room
            io.to('admin_room').emit('new_message', {
                conversationId,
                message,
                userId,
                timestamp: new Date()
            })

            // Also emit to specific user room for consistency
            io.to(`user_${userId}`).emit('message_sent', {
                conversationId,
                message,
                timestamp: new Date()
            })

        } catch (error) {
            console.log('Socket message error:', error)
        }
    })

    // Handle new message from admin
    socket.on('admin_send_message', async (data) => {
        try {
            const { conversationId, message, userId } = data

            // Send to specific user room
            io.to(`user_${userId}`).emit('new_admin_message', {
                conversationId,
                message,
                timestamp: new Date()
            })

        } catch (error) {
            console.log('Socket admin message error:', error)
        }
    })

    // Handle typing indicators
    socket.on('typing', (data) => {
        const { conversationId, userId, isTyping } = data
        socket.to('admin_room').emit('user_typing', {
            conversationId,
            userId,
            isTyping
        })
    })

    socket.on('admin_typing', (data) => {
        const { conversationId, userId, isTyping } = data
        socket.to(`user_${userId}`).emit('admin_typing', {
            conversationId,
            isTyping
        })
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    })
})

app.get('/api/ping', async (req, res) => {
    try {
        // Test database connection
        const mongoose = (await import('mongoose')).default
        const dbState = mongoose.connection.readyState

        
        if (dbState !== 1) {
            return res.status(503).json({
                success: false,
                message: "Database not ready",
                timestamp: new Date().toISOString()
            })
        }

        // Test a simple database operation
        const testCollection = mongoose.connection.db.collection('users')
        await testCollection.findOne({}, { limit: 1 })

        res.json({
            success: true,
            message: "Server and database are fully ready",
            timestamp: new Date().toISOString(),
            dbStatus: "connected"
        })
    } catch (error) {
        console.log('Ping check failed:', error.message)
        res.status(503).json({
            success: false,
            message: "Server not fully ready",
            error: error.message,
            timestamp: new Date().toISOString()
        })
    }
})

app.get('/',(req , res)=>{
    res.send("API Working")
})

server.listen(port, ()=> console.log('Server started on PORT: ' + port))
