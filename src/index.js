const express = require('express');
const paypal = require('paypal-rest-sdk');
require('dotenv').config()
const cors=require('cors')


const app = express();
app.use(express.json());
app.use(cors({}));
app.set('view engine','ejs');
app.use(express.urlencoded({extended:false}));

// Configure PayPal SDK
paypal.configure({
  mode: 'live', // Use 'sandbox' for testing, 'live' for production
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

app.get('/', (req, res) => res.render("index"));

// Set up payment route
app.get('/pay/:amount', (req, res) => {
    const {amount}=req.params;
  const paymentData = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: `${process.env.API_URL}/success`,
      cancel_url: `${process.env.API_URL}/cancel`,
    },
    transactions: [
      {
        amount: {
          total: amount, // Payment amount
          currency: 'USD', // Currency code
        },
        description: 'Support Imran',
      },
    ],
  };

  paypal.payment.create(paymentData, (error, payment) => {
    if (error) {
      console.error('Payment creation error:', error);
        res.status(500).send({error:'Payment creation error'});
    } else {
      // Redirect user to PayPal for payment approval
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
      res.redirect(approvalUrl);
    }
  });
});

// Handle PayPal callback after payment approval
app.get('/success', (req, res) => {
  const { paymentId, PayerID } = req.query;
  const executePayment = {
    payer_id: PayerID,
  };

  paypal.payment.execute(paymentId, executePayment, (error, payment) => {
    if (error) {
      console.error('Payment execution error:', error);
        res.status(500).send({error:'Payment execution error'});
    } else {
      console.log('Payment executed successfully:', payment);
        res.send({msg:'Payment completed successfully'});
    }
  });
});

app.get('/cancel', (req, res) => {
    res.send({error:'Payment cancelled'});
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
