const { Mongoose, default: mongoose, models } = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: [true,"Provide a username!"]
    },
    email:{
        type: String,
        required: [true,"Email is required to create a User Identity"]
    },
    password:{
        type: String,
        required: [true,"Password cannot be empty!"]
    },
    role: {
        type: String,
        required: [true]
    },
    isActive: {
        type: Boolean,
        default: true,
    }
})

const User = models.User || mongoose.model("User",userSchema);
export default User;