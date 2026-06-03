
import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError.utils.js"
import { asyncHandler } from "../utils/AsyncHandler.utils.js"
import User from "../models/user.model.js"

export const validationSource = {
    BODY: 'body',
    PARAMS: 'params',
    HEADERS: 'headers',
    QUERY: 'query'
}

export const validate = (schema, source = validationSource.BODY) => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source])

        if (!result.success) {
            console.log('this is error:', result.error.issues[0]?.message)
            return next(new ApiError(401, result.error.issues[0]?.message || 'Validation failed'))
        }

        req[source] = result.data
        next()
    }
}