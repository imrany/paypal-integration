const express = require('express');
const paypal = require('paypal-rest-sdk');
require('dotenv').config();

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': `${process.env.CLIENT_ID}`,
  'client_secret': `${process.env.CLIENT_SECRET}`
});

const app = express();

app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.get('/', (req, res) => res.sendFile(__dirname + "/index.html"));

app.post("/pay",async(req,res)=>{
    try{
        const {amount}=req.body
        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": `${process.env.API_URL}/success`,
                "cancel_url": `${process.env.API_URL}/cancel`
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Support Imran",
                        "sku": "001",
                        "price": `${amount}`,
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": `${amount}`
                },
                "description": "Support imran through paypal"
            }]
        }

        app.get('/success', (req, res) => {
            const payerId = req.query.PayerID;
            const paymentId = req.query.paymentId;
          
            const execute_payment_json = {
              "payer_id": payerId,
              "transactions": [{
                  "amount": {
                      "currency": "USD",
                      "total": `${amount}`
                    }
              }]
            };
            paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
                if (error) {
                    console.log(error.response);
                    throw error;
                } else {
                    console.log(JSON.stringify(payment));
                    res.send({msg:'Success'});
                }
            });
        });

        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                for(let i = 0;i < payment.links.length;i++){
                  if(payment.links[i].rel === 'approval_url'){
                    res.redirect(payment.links[i].href);
                  }
                }
            }
        });
    }catch(error){
        res.status(500).send({error:error.message})
    }
})

 app.get('/cancel', (req, res) => res.send({error:'Cancelled'}));
const PORT=process.env.PORT||8000
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
