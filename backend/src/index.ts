import express from "express";
import cors from "cors";


const app = express();
const PORT = 3000;

app.use(
    cors({
        origin: ["http://localhost:5173"],
    })
)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

app.get("/", (req, res) => {
    res.send("Welcome to the server!");
})

app.get("/api/hello", (req, res) => {
    res.json({message: "Hello world!"});
})

app.post("/api/login", (req, res) => {
    const {username, password} = req.body();
    res.json({message: "login"});
})