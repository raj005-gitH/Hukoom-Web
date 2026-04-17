const mongoose = require("mongoose");

const heroSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    skills: [
        {
            type: String,
        }
    ],
    phone: {
        type: Number,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("Hero", heroSchema);