// middleware/checkTokenExpiry.js
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const JWT_SECRET = "jkjdsnfsd()asjfbaujewhrhejwo[]jsdf";

require("../Database/models/Userdetails")
const User = mongoose.model("UserInfo")

const checkTokenExpiry = (req, res, next) => {
    // Get token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log('header missing');
        return res.status(401).json({ message: 'Authorization header is missing' });
    }

    const token = authHeader.split(' ')[1]; // Assuming Bearer <token>
    console.log(token);

    if (!token || token == null) {
        console.log('token missing');
        res.send({ status: 'NotOk', data: 'Token is missing' });
    }
    else {
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.log('invalid');
                res.send({ status: 'NotOk', data: 'Token expired' })
            } else if (Date.now() >= decoded.exp * 1000) {
                console.log('expired');
                res.send({ status: 'NotOk', data: 'Token expired' });
            } else {
                console.log("Token Active");
                next();
            }
        });
    }


};

module.exports = checkTokenExpiry;
