import mongoose from "mongoose";

export async function connect(){
    try {
        await mongoose.connect(process.env.MONGO_URI!)
        const connection = mongoose.connection;
        connection.on("connected",() => {
            console.log("Connected to database successfully!!");
        })
        connection.on("error",() => {
            console.log("Error in try part");
        })
    } catch (error:any) {
        console.log("Error in connect error catch!");
    }
}