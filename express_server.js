var express = require("express");
var cookieSession = require('cookie-session')
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));
app.set ("view engine", "ejs");

const users = {};
var urlDatabase = {};

//login
app.post("/login", (req, res) => {
  //check if the email exist and if the password is correct
  if (findEmail(req.body.email) && bcrypt.compareSync(req.body.password, findEmail(req.body.email).password)){
    req.session.user_id = findEmail(req.body.email);
    res.redirect("/urls");
  } else if (!req.body.email || !req.body.password){
    res.status(400).send("Please fill the in blank field");
  } else if (!findEmail(req.body.email)){
    res.status(400).send("there is no account for that email");
  } else if (findEmail(req.body.email).password !== req.body.password){
    res.status(400).send("wrong password");
  }
});

//logout
app.get("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});
// register
app.post("/register", (req, res) => {
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    // if the user doesnt already exist and to the datbase
    if (!findEmail(req.body.email)){
      let r = generateRandomString();
      users[r] = {id : r,
        email: req.body.email,
        password: hashedPassword};
      req.session.user_id = users[r];
      res.redirect("/urls");
    } else {
      res.status(400).send('email addrees already exists');
    }
});
//creats new TinyURL
app.post("/urls", (req, res) => {
  let r = generateRandomString();
  if (res.statusCode === 200){
      urlDatabase[r] = {};
      urlDatabase[r].longURL = req.body.longURL;
      urlDatabase[r].userid = req.session.user_id.id;
  }
  res.redirect("/urls/" + r);
});

// delete from database
app.post("/urls/:id/delete", (req, res) => {
  // make sure deleted data belongs to the user
  if(urlDatabase[req.params.id].userid  ===  req.session.user_id.id){
    delete urlDatabase[req.params.id];
  }
  res.redirect("/urls");
});

// edit url
app.post("/urls/:id", (req, res) => {
  // make sure edited data belongs to the user
  console.log(req.params.id);
   console.log(urlDatabase);
  if(urlDatabase[req.params.id].userid ==  req.session.user_id.id){
    urlDatabase[req.params.id].longURL = req.body.longURL;
  }
  console.log(urlDatabase);
  res.redirect("/urls");
});

//root
app.get("/", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// links to index
app.get("/urls", (req, res) => {
  let db = filterDB(urlDatabase, req);
  let templateVars = { urls: db, username: req.session.user_id};
  res.render("urls_index", templateVars);
});

// link to register
app.get("/register", (req, res) => {
  let templateVars =  {username: req.session.user_id};
  res.render("urls_register", templateVars);
});

// link to login
app.get("/login", (req, res) => {
  let templateVars =  {username: req.sessionuser_id};
  res.render("urls_login", templateVars);
});

// Link to new
app.get("/urls/new", (req, res) => {
  if (req.session.user_id === null){
    res.render("urls_login");
  }else {
    let templateVars =  {username: req.session.user_id};
    res.render("urls_new", templateVars );
  }

});

// links to longURL
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]){
    res.status(400).send('That is not a valid TinyURL');
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// links to show
app.get("/urls/:id", (req, res) => {

  if (req.session.user_id === null){
    res.status(400).send('You are not logged in');

  }
  if (!urlDatabase[req.params.id]){
    res.status(400).send('That is not a valid TinyURL');
  }
  if(urlDatabase[req.params.id].userid ==  req.session.user_id.id){
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.session.user_id};
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send('That is not your TinyURL');
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
// returns user if email found otherwise false
const findEmail = function(email){
  //loop through users object
  for (user of Object.values(users)){
     if (user.email === email){
        return user;
     }
  }
  return false;
};


function filterDB(db, req){
  let new_db = {};
  if (req.session.user_id){
    for (var shortURL in db){
        if (db[shortURL].userid === req.session.user_id.id){
          new_db[shortURL] = db[shortURL];
        }
    }
  }
  return new_db;
}

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}