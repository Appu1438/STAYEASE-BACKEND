const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    userName: { type: String, required: true },
    userId: { type: String, required: true },
    review: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
},{
    collection:"Reviews"
});

mongoose.model("Reviews",reviewSchema)