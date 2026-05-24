import { asyncHandler } from '../utils/AsyncHandler.utils.js'
import { ApiError } from '../utils/ApiError.utils.js'
import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'

const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
        if (!token) throw new ApiError(401, "UnAuthorized request!! No token provided")

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY)

        const user = await User.findById(decodedToken?._id).select(" -password -refreshToken ")
        if (!user) throw new ApiError(401, 'Invalid Access Token')

        req.user = user

        next()

    } catch (error) {
        throw new ApiError(401, 'No  loged in user')
    }
})

export { verifyJwt }