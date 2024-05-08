const  mongoose  = require("mongoose")

const HotelDetialsSchema=new mongoose.Schema({
    hotelname:String,
    hotelnumber:String,
    location:String,
    locationlink:String,
    actualrate: String,
    discountedrate:String,
    discountpercentage:String,
    taxandfee:String,
    rating:String,
    reviewcount:String,
    facilities:[String],
    images:[String],
},{
    collection:"HotelDetails"
  }
)

mongoose.model("HotelDetails",HotelDetialsSchema)