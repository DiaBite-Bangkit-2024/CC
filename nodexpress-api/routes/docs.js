const express = require("express");
const fs = require("fs");
const path = require("path");
const marked = require("marked");
const router = express.Router();

const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    let escapedText = text.toLowerCase().replace(/[^\w]+/g, "-");
    escapedText = escapedText.includes("-strong-")
      ? escapedText.split("-strong-")[1]
      : escapedText;

    return `<h${depth} id="${escapedText}">
      ${text}
    </h${depth}>`;
  },
};

marked.use({ renderer });

router.all("/", (req, res) => {
  const filePath = path.join(__dirname, "../docs.md");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Gagal membaca file Markdown:", err);
      return res.status(500).send("Internal Server Error");
    }

    const htmlContent = marked.parse(data);

    res.render("docs", { content: htmlContent });
  });
});

module.exports = router;
