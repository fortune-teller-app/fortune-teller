const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const supabase = require("./config/supabase");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Fortune Teller Backend API",
    status: "Running",
  });
});

app.get("/health", async (req, res) => {
  try {
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error) throw error;

    res.json({
      status: "Connected to Supabase",
    });
  } catch (err) {
    res.status(500).json({
      status: "Database connection failed",
      error: err.message,
    });
  }
});

module.exports = app;