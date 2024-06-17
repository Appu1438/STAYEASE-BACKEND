const mongoose = require('mongoose')


const Mongourl = "mongodb+srv://adithyans1438:appu@cluster0.wioe6vx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongoose.connect(Mongourl).then(() => {
    console.log("Database Connected")
}).catch((e) => {
    console.log(e)
})
