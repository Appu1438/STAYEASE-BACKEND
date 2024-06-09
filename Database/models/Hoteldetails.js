const  mongoose  = require("mongoose")

const HotelDetialsSchema=new mongoose.Schema({
    hoteluserid:String,
    hotelname:String,
    hotelnumber:String,
    location:String,
    locationlink:String,
    actualrate: String,
    discountedrate:String,
    discountpercentage:String,
    taxandfee:String,
    availablerooms:String,
    personsperroom:String,
    extraperhead:String,
    extraperroom:String,
    extraperday:String,
    facilities:[String],
    images:[String],
    available:{type:Boolean,default: true},
    reviewcount:{ type: Number, default: 0 },
    ratings:[Number],
    averageRating: { type: Number, default: 0 }

},{
    collection:"HotelDetails"
  }
)

mongoose.model("HotelDetails",HotelDetialsSchema)