import dotenv from 'dotenv'
import mongoose from 'mongoose'


dotenv.config()


const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log(`\n MongoDb connected successfully!! Db host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log('Error Connecting DB', error)
        process.exit(1)
    }
}

export default connectDb