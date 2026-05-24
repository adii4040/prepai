import User from '../models/user.model.js'

/*-------Import Utilities-----*/
import { asyncHandler } from '../Utils/AsyncHandler.utils.js'
import { ApiResponse } from '../Utils/ApiResponse.utils.js'
import { ApiError } from '../Utils/ApiError.utils.js'
import { cookieOption } from '../utils/constants.utils.js'


/*-----------Validation---------*/
import { validateUserRegisteration, validateUserLogin } from '../validators/user.validator.js'



const generateRefreshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        console.log('USEERRRR', user)

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, 'Something went wrong while generating accesstoken and refreshtoken')
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, password } = req.body
    console.log("DETAILS",fullname, email, password)

    if ([fullname, email, password].some((fields) => fields?.trim() === "")) throw new ApiError(400, 'All fields are required!!')

    const existedUser = await User.findOne({
        $or:[{ email }]
    })

    if (existedUser) throw new ApiError(409, 'User already exists!')

    const user = await User.create({
        fullname,
        email,
        password,
    })

    if (!user) throw new ApiError(401, 'User not registered!!')

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: createdUser,
            },
            'User registered successfully!'
        )
    )
})

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) throw new ApiError(404, "User doesn't exists")

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) throw new ApiError(400, 'Password is incorrect!')

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(user._id)

    const loggedinUser = await User.findById(user._id).select(" -password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedinUser,
                },
                "User loged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: { refreshToken: " " }
        },
        {
            new: true
        }
    )

    return res.status(200)
        .clearCookie("accessToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .json(
            new ApiResponse(
                200,
                "User loged out successfully!"
            )
        )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    console.log(req.user)
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    user: req?.user
                },
                "Successfully fetched the current user!"
            ))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
}