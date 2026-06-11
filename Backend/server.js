require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const heroRoutes = require("./routes/heroRoutes");
const queryRoutes = require("./routes/queryRoutes");
const aiRoutes = require("./routes/aiRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors"); //cross-origin resource sharing

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

connectDB();

app.use(cors());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", heroRoutes);
app.use("/api", queryRoutes);
app.use("/api", aiRoutes);
app.use("/api", messageRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port 3000");
});
