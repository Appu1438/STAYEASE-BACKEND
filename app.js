const express = require('express')
const app = express()
const mongoose = require('mongoose')
app.use(express.json())
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { default: Stripe } = require('stripe')
app.use(bodyParser.json());
app.use(express.json({ extended: false, limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: false, parameterLimit: 50000 }))


const JWT_SECRET = "jkjdsnfsd()asjfbaujewhrhejwo[]jsdf"

const PUBLISH_KEY = 'pk_test_51NtRBkSEmsfUtDI2xbYoEzVmCHkf7UlwgqRxbpKJSSPWugQXbowVpDiMXHhgg7bibtqWxP2GzEjuZieYQ4ns2fIC00kIt633nm'
const SECRET_KEY = 'sk_test_51NtRBkSEmsfUtDI2d0H4rCLhLQ1WxZ0feJa5nSeHwqshfl7zLkothfIjTXu2EOXbFHkQdsXxIkTR4jjPYuOKxt1l00PoBPENvI'

const stripe = require('stripe')(SECRET_KEY);


app.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;
    console.log(amount)
    const amountInPaisa = parseInt(amount * 100)
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPaisa,
            currency: 'INR',
            payment_method_types: ['card'],
        });

        const clientSecret = paymentIntent.client_secret;
        console.log(clientSecret);
        res.json({
            clientSecret: clientSecret
        })

        // res.send({ status: 'ok', data: clientSecret });
    } catch (e) {
        console.log(e);
        res.json({
            error: e.message
        })
        // res.status(500).send({ status: 'error', error: e.message });
    }
});

app.post('/refund', async (req, res) => {
    try {
        // Extract booking data from request body
        const { paymentMethodId, amount, id } = req.body;
        console.log(paymentMethodId, amount, id)

        // Use Stripe's API to create a refund
        const refund = await stripe.refunds.create({
            payment_intent: paymentMethodId,
            amount: amount  // Amount should be in cents
        });

        // Check if refund is successful
        if (refund.status === 'succeeded') {

            const updatedDocument = await Bookings.findByIdAndUpdate(id, { PaymentStatus: 'Refunded', RefundedAmount: amount / 100 });
            // Refund successful
            res.status(200).json({ status: 'ok', message: 'Refund successful' });
        } else {
            // Refund failed
            res.status(400).json({ success: false, message: 'Refund failed' });
        }
    } catch (error) {
        console.error('Error initiating refund:', error);
        res.status(500).json({ success: false, message: 'An error occurred while initiating the refund' });
    }
});

const Mongourl = "mongodb+srv://adithyans1438:appu@cluster0.wioe6vx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongoose.connect(Mongourl).then(() => {
    console.log("Database Connected")
}).catch((e) => {
    console.log(e)
})

require("./DB Models/Userdetails")
const User = mongoose.model("UserInfo")

require('./DB Models/Hoteldetails')
const Hotel = mongoose.model('HotelDetails')

require('./DB Models/Favourites')
const Favourites = mongoose.model('Favourites')

require('./DB Models/Bookings')
const Bookings = mongoose.model('Bookings')

require('./DB Models/Pending')

const Pending = mongoose.model('PendingDetails')


app.get("/", (req, res) => {
    res.send({ status: "Started" })
})

app.post('/generateOTP', (req, res) => {
    const { email } = req.body;

    // Generate a random OTP (in a real-world scenario, you might want to use a more secure method)
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Use your email service provider here
        auth: {
            user: 'adithyans1438@gmail.com', // Your email address
            pass: 'otls tpiy yemw dfig' // Your email password
        }
    });

    // Email content
    const mailOptions = {
        from: 'adithyans1438@gmail.com',
        to: email,
        subject: 'OTP For Your STAYEASE Account Verification',
        text: `Your OTP for Account Verification is: ${otp}`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ status: 'error', data: 'Failed to send OTP' });
        } else {
            console.log('Email sent:', info.response);
            res.status(200).json({ status: 'success', otp: otp });
        }
    });
});


app.post('/register', async (req, res) => {

    const { name, number, email, password, userType, image } = req.body

    const olduser = await User.findOne({ email: email })

    if (olduser) {
        return res.send({ data: "User already exist" })
    }
    const encryptedPassword = await bcrypt.hash(password, 10)
    console.log(encryptedPassword)
    try {
        await User.create({
            name: name,
            number: number,
            email: email,
            password: encryptedPassword,
            userType: userType,
            image: image
        })

        res.send({ status: "ok", data: "User Created" })
    } catch (err) {
        res.send({ status: "error", data: err })
    }
})

app.post('/login-user', async (req, res) => {
    const { email, password } = req.body
    const olduser = await User.findOne({ email: email })
    if (!olduser) {
        return res.send({ data: "User doesn't exists" })
    }
    if (await bcrypt.compare(password, olduser.password)) {
        const token = jwt.sign({ email: olduser.email }, JWT_SECRET)

        if (res.status(201)) {
            return res.send({ status: 'ok', data: token, userType: olduser.userType })
        } else {
            return res.send({ error: "error" })
        }

    } else {
        return res.send({ data: "Incorrect Password" })
    }
})

app.post('/user-data', async (req, res) => {
    const { token } = req.body;
    // console.log("Backend", token);

    try {
        const decodedUser = jwt.verify(token, JWT_SECRET);
        // console.log("DecodeUser",decodedUser)
        const userEmail = decodedUser.email;
        User.findOne({ email: userEmail })
            .then((data) => {
                return res.send({ status: 'ok', data: data });
            })
            .catch(err => {
                return res.status(404).send({ error: "User not found" });
            });
    } catch (err) {
        return res.status(401).send({ error: "Invalid token" });
    }
});


app.get('/get-all-users', async (req, res) => {

    try {
        const data = await User.find({})
        if (data.length == 0) {
            res.send({ data: 'No Users Found' })
        } else {
            res.send({ status: "ok", data: data })
        }
    } catch (err) {
        res.send({ data: 'Error Fetching Users' })
        console.log(err)
    }
})
app.post('/delete-user', async (req, res) => {
    const { email, userId } = req.body
    console.log(email, userId)

    try {
        const deletedUser = await User.findOneAndDelete({ email });
        const deleteFav = await Favourites.findOneAndDelete({ userId });
        if (deletedUser && deleteFav) {
            return res.send({ status: 'ok', data: "User and favorites deleted successfully" });
        } else {
            return res.send({ status: 'fail', data: "User or favorites not found" });
        }

    } catch (err) {
        res.send({ data: "Error in Deleting User" })

    }
})

app.post('/update-user', async (req, res) => {
    const { name, number, email, image } = req.body
    try {
        let user = await User.findOne({ email: email })
        await User.updateOne({ email: email }, {
            $set: {
                name,
                number,
                email,
                image
            }
        })

        console.log(user)
        res.send({ status: 'ok', data: user })
    } catch (err) {
        res.send({ data: "Error While Updating" })


    }
})

app.post('/update-password', async (req, res) => {
    const { email, password } = req.body
    try {
        let user = await User.findOne({ email: email })
        const encryptedPassword = await bcrypt.hash(password, 10)

        if (!user) {
            res.send({ data: `User Doesn't Exists!!!` })
        } else {
            await User.updateOne({ email: email }, {
                $set: {
                    password: encryptedPassword
                }
            })
            console.log(user)
            res.send({ status: 'ok', data: 'Password Updated' })
        }
    } catch (err) {
        res.send({ data: "Error While Updating" })


    }
})

app.post('/add-hotel', async (req, res) => {
    console.log(req.body)
    const _id=req.body._id
    try {

         
        const newBooking = new Hotel(req.body);

        if(_id){
            const pendingReq=await Pending.findByIdAndDelete({ _id })
        }
        // Save the booking to the database
        const savedBooking = await newBooking.save();
        res.send({ status: 'ok', data: 'Hotel Added Successfully' })


    } catch (err) {
        res.send({ data: 'Error in hotel Adding' })

    }
})
app.post('/req-hotel', async (req, res) => {
    console.log(req.body)
    try {


        const newBooking = new Pending(req.body);
        // Save the booking to the database
        const savedBooking = await newBooking.save();
        res.send({ status: 'ok', data: 'Requested Successfully' })


    } catch (err) {
        res.send({ data: 'Error in Requesting' })

    }
})


app.post('/update-business', async (req, res) => {
    const {
        hotelid,
        hoteluserid,
        hotelname,
        hotelnumber,
        location,
        locationlink,
        actualrate,
        discountedrate,
        discountpercentage,
        taxandfee,
        availablerooms,
        personsperroom,
        extraperhead,
        extraperroom,
        extraperday,
        rating,
        facilities,
        images
    } = req.body;

    try {
        const _id=hotelid
        const updatedHotel = await Hotel.findOneAndUpdate(
            { _id },
            {
                hoteluserid,
                hotelname,
                hotelnumber,
                location,
                locationlink,
                actualrate,
                discountedrate,
                discountpercentage,
                taxandfee,
                availablerooms,
                personsperroom,
                extraperhead,
                extraperroom,
                extraperday,
                rating,
                facilities,
                images
            },
            { new: true }
        );

        if (!updatedHotel) {
            return res.status(404).send('Hotel not found');
        }

        res.send({ status: 'ok', data: 'Hotel Updated Successfully' });
    } catch (error) {
        console.error('Error updating hotel:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/delete-business',async(req,res)=>{
    console.log(req.body._id)
    const _id=req.body._id
    
  try {
    const deletedHotel = await Hotel.findByIdAndDelete(_id);

    if (!deletedHotel) {
      return res.status(404).send('Hotel not found');
    }

    res.send({status:'ok',data:'Hotel was deleted successfully.'});
    
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).send('Internal Server Error');
  }
})

app.get('/get-all-hotels', async (req, res) => {
    try {
        const hotels = await Hotel.find({})
        if (hotels.length > 0) {
            res.send({ status: 'ok', data: hotels })
        } else {
            res.send({ data: 'Hotels Not Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }
})
app.get('/get-pending-hotels', async (req, res) => {
    try {
        const hotels = await Pending.find({})
        if (hotels.length > 0) {
            res.send({ status: 'ok', data: hotels })
        } else {
            res.send({ data: 'Requests Not Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }
})
app.post('/remove-pending-hotels', async (req, res) => {
    const { _id } = req.body
    console.log(_id)
    try {
        const hotels = await Pending.findOneAndDelete({ _id })
        if (hotels) {
            res.send({ status: 'ok', data: "Removed Succesfully" })
        } else {
            res.send({ data: 'Hotel Not Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }
})
app.get('/get-user-hotels/:hoteluserid', async (req, res) => {
    console.log(req.params.hoteluserid)

    try {
        const hoteluserid = req.params.hoteluserid
        const hotels = await Hotel.find({ hoteluserid })
        console.log(hotels)
        if (hotels.length > 0) {
            res.send({ status: 'ok', data: hotels })
        } else {
            res.send({ data: 'No Hotels Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }

})

app.get('/get-hotel-byID', async (req, res) => {
    try {
        const { id } = req.query;
        console.log(id); // Log the received ID for debugging
        const hotel = await Hotel.findById(id);
        if (hotel) {
            res.status(200).json({ status: 'ok', data: hotel });
        } else {
            res.status(404).json({ status: 'error', message: 'Hotel not found' });
        }
    } catch (err) {
        console.error('Error fetching hotel details:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
})

// Define API endpoint to add hotel to user favorites
app.post('/add-to-favorites', async (req, res) => {
    try {
        console.log(req.body);
        const { userId, hotelId } = req.body;

        // Find the user's favorites document, if it exists
        let userFavorites = await Favourites.findOne({ userId });

        // If the user's favorites document doesn't exist, create one
        if (!userFavorites) {
            userFavorites = new Favourites({ userId, hotels: [hotelId] });
        } else {
            // Check if the hotel is already in user's favorites
            if (userFavorites.hotels.includes(hotelId)) {
                return res.send({ status: 'error', data: 'Hotel is already a favorite' });
            }
            // Add the hotel to user's favorites
            userFavorites.hotels.push(hotelId);
        }
        // Save the document
        await userFavorites.save();

        res.send({ status: 'ok', data: 'Hotel added to favorites successfully' });
    } catch (error) {
        console.error('Error adding hotel to favorites:', error);
        res.send({ status: 'error', data: 'Failed to add hotel to favorites' });
    }
});


app.get('/get-favorites/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // console.log(userId)

        // Find the user's favorites docuent
        const userFavorites = await Favourites.findOne({ userId });

        if (!userFavorites) {
            return res.send({  data: 'No favourites found' }); // Return an empty array if user has no favorites
        }else{
            res.send({ status: 'ok', data: userFavorites.hotels });
        }

        // Return the list of favorite hotel IDs
    } catch (error) {
        console.error('Error getting user favorites:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get user favorites' });
    }
});

app.post('/remove-from-favorites', async (req, res) => {
    try {
        const { userId, hotelId } = req.body;

        // Find the user's favorites document
        const userFavorites = await Favourites.findOne({ userId });

        if (!userFavorites) {
            return res.send({ status: 'error', data: 'User favorites not found' });
        }

        // Check if the hotel is in user's favorites
        const index = userFavorites.hotels.indexOf(hotelId);
        if (index === -1) {
            return res.send({ status: 'error', data: 'Hotel is not in user favorites' });
        }
        // Remove the hotel from user's favorites and save the document
        userFavorites.hotels.splice(index, 1);
        await userFavorites.save();

        res.send({ status: 'ok', data: 'Hotel removed from favorites successfully' });
    } catch (error) {
        console.error('Error removing hotel from favorites:', error);
        res.send({ status: 'error', data: 'Failed to remove hotel from favorites' });
    }
});


app.post('/submit-booking', async (req, res) => {
    console.log(req.body)
    try {
        // Create a new booking instance using the request body data
        const newBooking = new Bookings(req.body);
        // Save the booking to the database
        const savedBooking = await newBooking.save();
        // Send the saved booking details back to the frontend
        await sendConfirmationEmail(req.body)
        res.send({ status: 'ok', data: savedBooking })
    } catch (error) {
        // Handle errors
        console.error('Error submitting booking:', error);
        res.send({ data: 'Internal server error' });
    }
})

async function sendConfirmationEmail(bookingData) {
    const _id = bookingData.userId
    const olduser = await User.findById({ _id })
    console.log('mail ', olduser)

    // Create a Nodemailer transporter using your email service provider's SMTP settings
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Use your email service provider here
        auth: {
            user: 'adithyans1438@gmail.com', // Your email address
            pass: 'otls tpiy yemw dfig' // Your email password
        }
    });

    // Compose the email message
    const mailOptions = {
        from: 'adithyans1438@gmail.com',
        to: olduser.email,
        subject: 'Booking Confirmation',
        html: `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        max-width: 600px;
                        margin: auto;
                        padding: 20px;
                        border: 1px solid #ccc;
                        border-radius: 10px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .booking-details {
                        margin-bottom: 20px;
                    }
                    .booking-details p {
                        margin: 5px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Booking Confirmation</h1>
                    </div>
                    <div class="booking-details">
                        <p>Dear ${olduser.name},</p>
                        <p>Thank you for your booking!</p>
                        <p>Hotel: ${bookingData.hotelName}</p>
                        <p>Check-in: ${formatDate(bookingData.CheckIn)}</p>
                        <p>Check-out: ${formatDate(bookingData.CheckOut)}</p>
                        <p>Please carry your original ID proof during check-in.</p>
                        <p>This is a mandatory requirement for verification purposes.</p> <!-- New message --><br>
                        <p>Cancellation is available until the check-in time.</p>
                        <p>Pay now and get discount upto ₹200!  </p> <!-- New message -->                
                    </div>
                        <div class="footer">
                        <p>Regards,<br>STAYEASE</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    // Function to format date in "24 Apr 2024" format


    // Send the email
    await transporter.sendMail(mailOptions);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

app.get('/get-booking-deatils/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        let Booking = await Bookings.findById(_id).populate('hotelId');
        console.log('Booking', Booking)
        res.send({ status: 'ok', data: Booking });
    } catch (err) {
        res.send({ data: "Error Fetching booking" });
    }

})

app.get('/get-user-bookings/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        let Booking = await Bookings.find({ userId })
        console.log("userbook", Booking)
        if (Booking.length == 0) {
            return res.send({ data: 'No Bookings Found' }); // Return an empty array if user has no favorites
        } else {
            res.send({ status: 'ok', data: Booking });
        }
        // Return the list of favorite hotel IDs
    } catch (err) {
        res.send({ data: 'Something Error' });
    }
})
app.get('/get-business-bookings/:hoteluserId', async (req, res) => {
    try {
        const hoteluserId = req.params.hoteluserId
        let Booking = await Bookings.find({ hoteluserId })
        console.log("BusinessBook", Booking)
        if (Booking.length == 0) {
            return res.send({ data: 'No Bookings Found' }); // Return an empty array if user has no favorites
        } else {
            res.send({ status: 'ok', data: Booking });
        }
        // Return the list of favorite hotel IDs
    } catch (err) {
        res.send({ data: 'Something Error' });

    }
})

app.post('/cancel-booking', async (req, res) => {
    const { id } = req.body
    console.log('cancel', id)

    try {
        // Find the document by its ID and update it
        const updatedDocument = await Bookings.findByIdAndUpdate(id, { BookingStatus: 'Cancelled' });

        if (!updatedDocument) {
            return res.send({ data: 'Document not found' });
        }
        else {
            // Document updated successfully
            await CancelationEmail(updatedDocument);
            return res.send({ status: 'ok', data: updatedDocument });
        }


    } catch (error) {
        console.error('Error cancelling booking:', error);
        return res.send({ error: 'Internal server error' });
    }
})

async function CancelationEmail(bookingData) {
    try {
        // Retrieve user details based on booking data (assuming 'userId' field exists in bookingData)
        const user = await User.findById(bookingData.userId);

        // Create Nodemailer transporter using your email service provider's SMTP settings
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'adithyans1438@gmail.com', // Your email address
                pass: 'otls tpiy yemw dfig' // Your email password
            }
        });

        // Compose the email message
        const mailOptions = {
            from: 'adithyans1438@gmail.com',
            to: user.email,
            subject: 'Booking Cancelled',
            html: `
                <html>
                <head>
                <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .container {
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 10px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .booking-details {
                    margin-bottom: 20px;
                }
                .booking-details p {
                    margin: 5px 0;
                }
            </style>
                </head>
                <body>
                <div class="container">
                <div class="header">
                    <h1>Booking Cancellation Confirmation</h1>
                </div>
                <div class="booking-details">
                    <p>Dear ${user.name},</p>
                    <p>Your booking has been cancelled!</p>
                    <p>Booking details:</p>
                    <p>Hotel: ${bookingData.hotelName}</p>
                    <p>Check-in: ${formatDate(bookingData.CheckIn)}</p>
                    <p>Check-out: ${formatDate(bookingData.CheckOut)}</p>
                    ${bookingData.PaymentStatus == 'paid' ? `
                    <p>A refund for your booking payment has been initiated as per our cancellation policies. Please allow up to 7 days for the refund to be processed.</p>
                    <p>If you have any further inquiries regarding the refund, please contact us.</p>
                    ` : ''}
                    <p>If you have any questions or concerns, please feel free to contact us.</p>
                </div>
                    <div class="footer">
                    <p>Regards,<br>STAYEASE</p>
                </div>
            </div>
                </body>
                </html>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending cancellation confirmation email:', error);
    }
}

app.post('/update-payment-sts', async (req, res) => {
    const { _id, TotalAmount } = req.body
    const paymentDetails = req.body.PaymentDetails
    console.log(_id, TotalAmount, paymentDetails)

    try {
        // Find the document by its ID and update it
        const updatedDocument = await Bookings.findByIdAndUpdate(_id, {
            $set: {
                PaymentStatus: 'paid',
                PaidAmount: TotalAmount,
                PaymentDetails: paymentDetails
            },
        }, { new: true });

        if (!updatedDocument) {
            return res.send({ data: 'Document not found' });
        }
        else {
            // Document updated successfully
            await sendPaymentConfirmationEmail(updatedDocument, TotalAmount)
            return res.send({ status: 'ok', data: updatedDocument });
        }

    } catch (error) {
        console.error('Error cancelling booking:', error);
        return res.send({ error: 'Internal server error' });
    }
})

async function sendPaymentConfirmationEmail(bookingData, Total) {
    try {
        // Retrieve user details based on booking data (assuming 'userId' field exists in bookingData)
        const user = await User.findById(bookingData.userId);

        // Create Nodemailer transporter using your email service provider's SMTP settings
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'adithyans1438@gmail.com', // Your email address
                pass: 'otls tpiy yemw dfig' // Your email password
            }
        });

        // Compose the email message
        const mailOptions = {
            from: 'adithyans1438@gmail.com',
            to: user.email,
            subject: 'Payment Confirmation',
            html: `
                <html>
                <head>
                    <style>
                        /* Your email styles here */
                        body {
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            max-width: 600px;
                            margin: auto;
                            padding: 20px;
                            border: 1px solid #ccc;
                            border-radius: 10px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .booking-details {
                            margin-bottom: 20px;
                        }
                        .booking-details p {
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>

                <div class="container">
                <div class="header">
                    <h2>Payment Confirmation for Your Booking ID: ${bookingData.BookingId}</h2>
                </div>
                <div class="booking-details">
                    <p>Dear ${user.name},</p>
                    <p>Your payment has been confirmed</p>
                    <p>Booking details:</p>
                    <p>Hotel: ${bookingData.hotelName}</p>
                    <p>Check-in: ${formatDate(bookingData.CheckIn)}</p>
                    <p>Check-out: ${formatDate(bookingData.CheckOut)}</p>
                    <p>Total Amount: ${Total}</p>
                    <p>Thank you for choosing STAYEASE!</p>
                    <p>Have a Nice Day</p>
                </div>
                    <div class="footer">
                    <p>Regards,<br>STAYEASE</p>
                </div>
            </div>
                </body>
                </html>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
    }
}


app.listen(1438, () => {

    console.log("Node js Server Started")
})