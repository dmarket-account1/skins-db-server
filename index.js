import express, { query } from "express";
import cors from "cors";
import * as mongodb from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "10mb" }));
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;
const JWT_TOKEN = process.env.JWT_TOKEN;

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

app.post("/add-skin", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(400).send("Bad request.");
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    if (token !== JWT_TOKEN) {
      throw new Error("Try again later.");
    }
  } catch (error) {
    res.status(401).send("Unauthorized.");
    return;
  }
  const body = req.body;

  if (body.data == undefined) {
    res.status(400).send("Bad request.");
    return;
  }

  const db = mongoClient.db("steam-skins");

  const isSkin = await db.collection("skins").findOne({
    "extra.floatValue": body.data.extra.floatValue,
  });

  if (isSkin) {
    res.status(400).send("Skin has been already added");
    return;
  }

  body.data.date = new Date(body.data.date);
  await db.collection("skins").insertOne(body.data);
  res.status(200).send("Success");
});

app.get("/skins", async (req, res) => {
  // const query = req.query;
  // const filter = {};
  const db = mongoClient.db("steam-skins");
  const skins = await db.collection("skins").find({}).toArray();
  res.status(200).json({ data: skins });
});

app.get("/statistics", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(400).send("Bad request.");
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    if (token !== JWT_TOKEN) {
      throw new Error("Try again later.");
    }
  } catch (error) {
    res.status(401).send("Unauthorized.");
    return;
  }

  const db = mongoClient.db("steam-skins");
  const skins = await db.collection("skins").find({}).toArray();
  const today = new Date();
  const todaySkins = skins.filter((skin) => {
    const skinDate = new Date(skin.date);
    if (
      skinDate.getDay() == today.getDay() &&
      skinDate.getFullYear() == today.getFullYear()
    ) {
      return skin;
    }
  });
  const last7Days = skins.filter((skin) => {
    const skinDate = new Date(skin.date);
    const todayMinus7Days = today.getTime() - 7 * 24 * 60 * 60 * 1000;
    if (skinDate.getTime() > todayMinus7Days) {
      return skin;
    }
  });
  const last30Days = skins.filter((skin) => {
    const skinDate = new Date(skin.date);
    const todayMinus7Days = today.getTime() - 30 * 24 * 60 * 60 * 1000;
    if (skinDate.getTime() > todayMinus7Days) {
      return skin;
    }
  });

  res.status(200).json({
    "today": todaySkins,
    "7 days": last7Days,
    "30 days": last30Days,
  });
});

app.listen(3000, async () => {
  mongoClient.connect().then(() => {
    console.log(`Server is live.`);
  });
});
