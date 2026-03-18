import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoute.js";
import geminiRoutes from "./routes/geminiRoute.js";


const app = express();
const PORT = 3000;

app.use(
    cors({
        origin: ["http://localhost:5173"],
    })
)

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

app.get("/", (req, res) => {
    res.send("Welcome to the server!");
})

app.get("/api/hello", (req, res) => {
    res.json({message: "Hello world!"});
})

app.use("/api", authRoutes);
app.use("/api", geminiRoutes);
