const  mongoose  = require("mongoose")

const PendingDetialsSchema=new mongoose.Schema({
    hoteluserid:String,
    hotelname:String,
    hotelnumber:String,
    location:String,
    locationlink:String,
    actualrate: String,
    discountedrate:String,
    discountpercentage:String,
    taxandfee:String,
    extraperhead:String,
    extraperroom:String,
    extraperday:String,
    rating:String,
    reviewcount:String,
    facilities:[String],
    images:[String],
},{
    collection:"PendingDetails"
  }
)

mongoose.model("PendingDetails",PendingDetialsSchema)