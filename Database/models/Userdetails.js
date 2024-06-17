const  mongoose  = require("mongoose")

const UserDetailSchema=new mongoose.Schema({
    name:String,
    number:String,
    email:{ type: String,unique:true},
    password:String,
    userType:String,
    image:String,

},{
    collection:"UserInfo"
  }
)

mongoose.model("UserInfo",UserDetailSchema)
