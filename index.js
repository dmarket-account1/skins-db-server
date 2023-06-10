import express from "express";
import cors from "cors";
import * as mongodb from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "10mb" }));
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

const mongoClient = new mongodb.MongoClient(MONGODB_URL);

let data = {};

const updateSkinsDB = async () => {
  const db = mongoClient.db("steam-skins");
  data = { ...db.collection("items-db").findOne({ id: "items-db" }) };
  delete data._id;
  delete data.id;
};

const start = () => {
  updateSkinsDB();

  setInterval(() => {
    updateSkinsDB;
  }, 21600 * 1000);
};

app.get("/", (req, res) => {
  res.status(200).json({
    status: "SkinsDB is working.",
    info: {
      "last_updated": data.lastUpdated,
    },
  });
});

app.get("/db", (req, res) => {
  if (data.data) {
    res.status(200).json(data.data);
  } else {
    res.status(400).send("Try one more time");
  }
});

app.listen(3000, async () => {
  mongoClient.connect().then(() => {
    console.log(`Server is live.`);
    start();
  });
});
