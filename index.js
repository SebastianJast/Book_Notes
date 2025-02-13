import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booklist",
  password: "Pqpq12345.",
  port: 5432,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let books = [];
let bookId;

async function getImgNumber(title) {
  const response = await axios.get(`https://openlibrary.org/search.json?q=${title}&page=1`);
  return response.data.docs[0].cover_edition_key || null;
}

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books ORDER BY id ASC");
    books = result.rows;
    res.render("index.ejs", { books: books });
  } catch (err) {
    console.log(err);
  }
});

app.post("/", async (req, res) => {
  bookId = parseInt(req.body.edit);
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [
      bookId,
    ]);
    res.render("modify.ejs", { book: result.rows[0] });
  } catch (err) {
    console.log(err);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const id = parseInt(req.body.delete);
    console.log(id);
    const result = await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/edit", async (req, res) => {
  const title = req.body.title;
  const review = req.body.review;
  const author = req.body.author;
  const img = await getImgNumber(title);
  try {
    const result = await db.query(
      "UPDATE books SET title = $1, author = $2, review = $3, img = $4 WHERE id = $5",
      [title, author, review, img, bookId]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.get("/new", (req, res) => {
  res.render("new.ejs");
});

app.post("/add", async (req, res) => {
  const title = req.body.title;
  const review = req.body.review;
  const author = req.body.author;
  const img = await getImgNumber(title);
  try {
    const result = await db.query(
      "INSERT INTO books (title,author,review,img) VALUES ($1,$2,$3,$4)",
      [title, author, review, img]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
