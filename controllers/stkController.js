const axios = require("axios");

const Payment = require("../models/paymentModel");

let token = "";

exports.generateToken = async (req, res, next) => {
  try {
    const secret = "eU0P97Q0pLmi6aU4";
    const consumer = "nJNJEDroEMug7oBuyp8Hk81mkCrBsSAZ";

    const auth = new Buffer.from(`${consumer}:${secret}`).toString("base64");

    await axios
      .get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            authorization: `Basic ${auth}`,
          },
        }
      )
      .then((response) => {
        console.log(response.data.access_token);

        token = response.data.access_token;
        next();
      });
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
};

exports.sendStkNotification = async (req, res) => {
  const phone = req.body.phone.substring(1);
  const { amount } = req.body;

  const date = new Date();

  const timestamp =
    date.getFullYear() +
    `0${date.getMonth() + 1}`.slice(-2) +
    `0${date.getDate()}`.slice(-2) +
    `0${date.getHours()}`.slice(-2) +
    `0${date.getMinutes()}`.slice(-2) +
    `0${date.getSeconds()}`.slice(-2);

  const shortcode = 174379;
  const passkey =
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

  const password = new Buffer.from(shortcode + passkey + timestamp).toString(
    "base64"
  );

  // res.json({ phone, amount });

  await axios
    .post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",

      {
        BusinessShortCode: 174379,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: `254${phone}`,
        PartyB: 174379,
        PhoneNumber: `254${phone}`,
        CallBackURL: "https://6aad-154-79-248-192.in.ngrok.io/api/stk/callback",
        AccountReference: "Test",
        TransactionDesc: "Test",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((data) => {
      res.status(200).json(data.data);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
};

exports.callback = (req, res) => {
  const callbackData = req.body;
  console.log(callbackData);

  if (!callbackData.Body.stkCallback.CallbackMetadata) {
    console.log(callbackData.Body);
    return res.json("ok");
  }

  // console.log(callbackData.Body.stkCallback.CallbackMetadata);

  const phone = callbackData.Body.stkCallback.CallbackMetadata.Item[4].Value;
  const amount = callbackData.Body.stkCallback.CallbackMetadata.Item[0].Value;
  const trnx_id = callbackData.Body.stkCallback.CallbackMetadata.Item[1].Value;

  console.log({ phone, amount, trnx_id });

  const payment = new Payment();

  payment.number = phone;
  payment.amount = amount;
  payment.trnx_id = trnx_id;

  payment
    .save()
    .then((data) => {
      console.log({ message: "Transaction saved to the database", data });
    })
    .catch((err) => {
      console.log(err.message);
    });
};
