const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
const app = express();
const port = process.env.PORT;
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
const apiRoutes = require("./routes");
app.use("/api", apiRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
