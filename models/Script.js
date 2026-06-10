const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    topic: {
        type: String,
        required: true,
    },
    generatedScript: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Script', scriptSchema);