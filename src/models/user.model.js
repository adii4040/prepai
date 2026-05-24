import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,

    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    },

}, {
    timestamps: true
})


//Before saving the user credentials, hash the plain password
userSchema.pre('save', async function () {
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})


//While login check if the given plain password by the user matched the hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
    const user = this
    return await bcrypt.compare(password, user.password)
}

//When user logs in then provide him a access token to authorize him
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            fullname: this.fullname,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        {
            expiresIn: 24 * 60 * 60 * 1000
        })
}

//Now also provide the refresh token 
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        {
            expiresIn: 60 * 60
        }
    )
}


const User = mongoose.model('User', userSchema)

export default User