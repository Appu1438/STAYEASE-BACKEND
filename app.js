const express = require('express')
const app = express()

app.use(express.json())

const db = require('./Database/connection')
const mongoose = require('mongoose')

const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { default: Stripe } = require('stripe')

app.use(bodyParser.json());
app.use(express.json({ extended: false, limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: false, parameterLimit: 50000 }))

require("./Database/models/Userdetails")
const User = mongoose.model("UserInfo")

require('./Database/models/Hoteldetails')
const Hotel = mongoose.model('HotelDetails')

require('./Database/models/Favourites')
const Favourites = mongoose.model('Favourites')

require('./Database/models/Bookings')
const Bookings = mongoose.model('Bookings')

require('./Database/models/Pending')
const Pending = mongoose.model('PendingDetails')

require('./Database/models/Reviews')
const Reviews = mongoose.model('Reviews')


const UserRouter = require("./Routers/UserRouter")
app.use('/user', UserRouter);

const HotelRouter = require('./Routers/HotelRouter')
app.use('/hotel', HotelRouter)

const AdminRouter = require('./Routers/AdminRouter')
app.use('/admin', AdminRouter)


const PUBLISH_KEY = 'pk_test_51NtRBkSEmsfUtDI2xbYoEzVmCHkf7UlwgqRxbpKJSSPWugQXbowVpDiMXHhgg7bibtqWxP2GzEjuZieYQ4ns2fIC00kIt633nm'
const SECRET_KEY = 'sk_test_51NtRBkSEmsfUtDI2d0H4rCLhLQ1WxZ0feJa5nSeHwqshfl7zLkothfIjTXu2EOXbFHkQdsXxIkTR4jjPYuOKxt1l00PoBPENvI'

const stripe = require('stripe')(SECRET_KEY);



function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

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
})

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


app.post('/create-invoice', async (req, res) => {
    try {
        const { customerName, customerEmail, amount, description } = req.body;
        
        // Create a customer in Stripe
        const customer = await stripe.customers.create({
            email: customerEmail,
            name: customerName,
        });

        // Create an invoice item
        await stripe.invoiceItems.create({
            customer: customer.id,
            amount: amount * 100, // Convert amount to cents
            currency: 'inr',
            description: description,
        });

        // Create the invoice
        const invoice = await stripe.invoices.create({
            customer: customer.id,
          });

          console.log(invoice);


        // Finalize the invoice (optional step)
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        console.log(finalizedInvoice);

        // Get the invoice PDF URL
        const invoiceUrl = finalizedInvoice.hosted_invoice_url;
        console.log(invoiceUrl);

        // Respond with the invoice URL
        res.send({ status: 'ok', data: invoiceUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


app.get("/", (req, res) => {
    res.send({ status: "Started" })
})
app.get("/home", (req, res) => {
    res.send({ status: "Home" })
})

const PORT=1438

app.listen(PORT, () => {

    console.log("Node js Server Started")
})