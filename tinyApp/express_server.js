var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set ("view engine", "ejs");

const users = {};

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//login
app.post("/urls/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});
//logout
app.post("/urls/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});
// register
app.post("/urls/register", (req, res) => {
    if (!findEmail(req.body.email)){
      console.log(findEmail(req.body.email));
      let r = generateRandomString();
      res.cookie("user_id", r);
      users[r] = {id : r,
        email: req.body.email,
        password: req.body.password};
      console.log("users: ",users);
      res.redirect("/urls");
    } else {
      res.status(400).send('email addrees already exists');;
    }
});
//creats new TinyURL
app.post("/urls", (req, res) => {
  let r = generateRandomString();
  if (res.statusCode === 200){
      urlDatabase[r] = req.body.longURL;  // Log the POST request body to the console
    }
  res.redirect("/urls/" + r);         // Respond with 'Ok' (we will replace this)
});

// delete from database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// update longURL
app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});
// links to index
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase , username: req.cookies["user_id"]};
  res.render("urls_index", templateVars);
});
// link to register
app.get("/urls/register", (req, res) => {
  res.render("urls_register");
});
// rendercreate URL page
app.get("/urls/new", (req, res) => {
  let templateVars =  {username: req.cookies["user_id"]}
  res.render("urls_new", templateVars );
});

// links to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];

  res.redirect(longURL);
});

// links to show ShortURL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["user_id"]};
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const findEmail = function(email){
  console.log("users: ",users);
  for (user of Object.values(users)){
      console.log("user: ",user);
     if (user.email === email){
        return true;
     }

  }
  return false;
};

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}