const express = require("express")
const app = express()

const PORT = 3000;

app.use(express.json())

app.get("/", (req, res) => {
    res.json({
        msg: "running"
    })
})

app.listen(PORT, () => console.log(`running at http://localhost:${PORT} !`))