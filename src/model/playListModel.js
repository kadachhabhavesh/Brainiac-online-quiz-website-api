const mongoose = require("mongoose")
const subjectModel = require("./subjectModel")

const schema = mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    image:{
        type: String,
        required: true,
        trim: true,
    },
    subject:{
        type: String,
        required: true,
    },
    quizziz:{
        type: [String],
        required: true,
    },
    creator:{
        type: String,
        required: true,
        trim: true,
    },
    createDate:{
        type: Date,
        required: false,
        default: Date.now
    },
})

module.exports = mongoose.model("PlayList",schema)