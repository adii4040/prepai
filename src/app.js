import express from 'express'
import cookieParser from 'cookie-parser'


const app = express()

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))

 //for local dev
 
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static('public'))
app.use(cookieParser())


//Import all the routes
import healthCheckRoute from './routes/healthcheck.route.js'
import userRoutes from './routes/user.route.js'
import resumeAnalysisRoute from './routes/resume-analysis.route.js'


app.use('/api/v1/healthcheck', healthCheckRoute)
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/resume-analysis', resumeAnalysisRoute)

// Global error handler (must come after all routes)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.log(err)

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    data: null,
    statusCode: statusCode
  });
});

export {app}
