const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
// const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = 3000;
const url = "mongodb://localhost:27017/MEAN";
const mongoose = require("mongoose");

//app.get('/', (req, res) => res.send('hello'));

app.use(bodyParser.json());
app.use(cors());

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", () => {
  console.log("connected to mongodb");
});

const MessageSchema = new mongoose.Schema();

const Message = mongoose.model("Message", {
  userName: String,
  msg: String,
});

const User = mongoose.model("User", {
  name: String,
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
});

app.post("/api/message", async (req, res) => {
  // const message = req.body
  // console.log(message);

  const message = new Message(req.body);
  message.save();

  // db.collection('messages').insertOne(message);

  let user = await User.findOne({ name: message.userName });

  if (!user) {
    user = new User({ name: message.userName });
  }

  user.messages.push(message);
  user.save();

  res.status(200).send();
});

app.get("/api/message", async (req, res) => {
  const docs = await Message.find();

  if (!docs) return res.json({ error: "Could not get message" });

  res.json(docs);
});

app.get("/api/user/:name", async (req, res) => {
  const name = req.params.name;

  const user = await User.user([
    { $match: {name}},
    { $project: { messages: 1, name: 1, isGold: { $gte: [{$size: "$messages"}, 5] } } },
  ]);

  await User.populate(user, {path: 'messages'});

  res.json(user[0]);

//   return res.json(await User.findOne({ name }).populate("messages"));
});

mongoose.connect(url);

// MongoClient.connect(url, function(err, client) {
//     if(err) return console.log('mongodb error', err);
//     console.log("Connected successfully to server");

//     db = client.db(dbName);

//     //client.close();
//   });

app.listen(port, () => console.log("App running. Port:", port));
