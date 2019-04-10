var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set ("view engine", "ejs");

const users = {};
var urlDatabase = {};

//login
app.post("/login", (req, res) => {
  if (findEmail(req.body.email) && findEmail(req.body.email).password === req.body.password){
    res.cookie("user_id",findEmail(req.body.email));
    res.redirect("/urls");
  } else if (!findEmail(req.body.email)){
    res.status(400).send("there is no account for that email");
  } else if (findEmail(req.body.email).password !== req.body.password){
    res.status(400).send("wrong password");
  }
});

//logout
app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});
// register
app.post("/register", (req, res) => {
    const password = req.body.password; // found in the req.params object
    const hashedPassword = bcrypt.hashSync(password, 10);
    if (!findEmail(req.body.email)){
      let r = generateRandomString();
      users[r] = {id : r,
        email: req.body.email,
        password: hashedPassword};
      res.cookie("user_id", users[r]);
      res.redirect("/urls");
    } else {
      res.status(400).send('email addrees already exists');;
    }
});
//creats new TinyURL
app.post("/urls", (req, res) => {
  let r = generateRandomString();
  if (res.statusCode === 200){
      urlDatabase[r] = {};
      urlDatabase[r].longURL = req.body.longURL;
      urlDatabase[r].userid = req.cookies["user_id"].id; // Log the POST request body to the console
  }
  res.redirect("/urls/" + r);         // Respond with 'Ok' (we will replace this)
});

// delete from database
app.post("/urls/:id/delete", (req, res) => {
  if(urlDatabase[req.params.id].userid  ===  req.cookies["user_id"].id){
    delete urlDatabase[req.params.id];
  }
  res.redirect("/urls");
});

// update longURL
app.post("/urls/:id", (req, res) => {
  if(urlDatabase[req.params.id].userid ==  req.cookies["user_id"].id){
    urlDatabase[req.params.id] = req.body.longURL;
  }
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});
// links to index
app.get("/urls", (req, res) => {
  let db = filterDB(urlDatabase, req);
  let templateVars = { urls: db, username: req.cookies["user_id"]};
  res.render("urls_index", templateVars);
});
// link to register
app.get("/register", (req, res) => {
  let templateVars =  {username: req.cookies["user_id"]}
  res.render("urls_register", templateVars);
});

// link to login
app.get("/login", (req, res) => {
  let templateVars =  {username: req.cookies["user_id"]}
  res.render("urls_login", templateVars);
});
// rendercreate URL page
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"] === undefined){
    res.render("urls_login");
  }else {
    let templateVars =  {username: req.cookies["user_id"]}
    res.render("urls_new", templateVars );
  }

});

// links to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

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
  for (user of Object.values(users)){
     if (user.email === email){
        return user;
     }
  }
  return false;
};
function filterDB(db, req){
  let new_db = {};
  if (req.cookies["user_id"]){
    for (var shortURL in db){
        if (db[shortURL].userid === req.cookies["user_id"].id){
          new_db[shortURL] = db[shortURL];
        }
    }
  }
  return new_db;
}
function generateRandomString() {
  return Math.random().toString(36).substring(7);
}