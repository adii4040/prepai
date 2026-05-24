import { asyncHandler } from '../utils/AsyncHandler.utils.js'
import {ApiResponse} from '../utils/ApiResponse.utils.js'


const healthCheck = asyncHandler( async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, { message: 'Server is running noicely!!'})
    )
})

export {healthCheck}