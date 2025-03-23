const mongoose = require('mongoose')

const OTPschema = new mongoose.Schema({
    OTP:{
        type:String,
        length:6
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

const schema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true,
    },
    lastname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    usertype:{
        type:String,
        required:true,
    },
    OTP:{
        type:OTPschema
    },
    Emailverified:{
        type:Boolean,
    }
})

module.exports = mongoose.model("User", schema)