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

const updateSkinsDB = async () => {
  const db = mongoClient.db("steam-skins");
  const data = {
    ...(await db.collection("items-db").findOne({ id: "items-db" })),
  };
  delete data._id;
  delete data.id;
  return data;
};

app.get("/", (req, res) => {
  res.status(200).json({
    status: "SkinsDB is working.",
  });
});

app.get("/db", async (req, res) => {
  try {
    const data = await updateSkinsDB();
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(400).send("Try again later.");
  }
});

app.listen(3000, async () => {
  mongoClient.connect().then(() => {
    console.log(`Server is live.`);
  });
});
