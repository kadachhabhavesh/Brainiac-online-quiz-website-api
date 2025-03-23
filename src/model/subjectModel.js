const mongoose = require("mongoose");

const schema = new mongoose.Schema({
        subject: {
                type: String,
                required: true,
                trim: true,
        },
});

module.exports = mongoose.model("Subject", schema);
