const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
// stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// middlewares
app.use(express.json());
app.use(cors());

// URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.x3egp.mongodb.net/?appName=Cluster0`;

// create client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // DB & Collections
    const db = client.db("zap_shift_db");
    const parcelsCollection = db.collection("parcels");
    // get parcel
    app.get("/parcels", async (req, res) => {
      const query = {};
      const email = req.query.email;
      if (email) {
        query.senderEmail = email;
      }
      const options = { sort: { createdAt: -1 } };
      const result = await parcelsCollection.find(query, options).toArray();
      res.send(result);
    });
    // get single parcel
    app.get("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.findOne(query);
      res.send(result);
    });
    // post parcel
    app.post("/parcels", async (req, res) => {
      // creation time
      req.body.createdAt = new Date();
      const result = await parcelsCollection.insertOne(req.body);
      res.send(result);
    });
    // delete parcel
    app.delete("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.deleteOne(query);
      res.send(result);
    });

    // payment related apis
    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Provide the exact Price ID (for example, price_1234) of the product you want to sell
            price: "{{PRICE_ID}}",
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success`,
      });
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Zap Shift is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
