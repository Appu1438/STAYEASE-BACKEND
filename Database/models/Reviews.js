const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    userName: { type: String, required: true },
    userId: { type: String, required: true },
    review: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating from 1 to 5
    createdAt: { type: Date, default: Date.now }
},{
    collection:"Reviews"
});

mongoose.model("Reviews",reviewSchema)