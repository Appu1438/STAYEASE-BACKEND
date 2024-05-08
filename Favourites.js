const  mongoose  = require("mongoose")

const FavouriteSchema=new mongoose.Schema({
    userId:String,
    hotels:[String]
},{
    collection:"Favourites"
  }
)

mongoose.model("Favourites",FavouriteSchema)