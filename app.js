const app = require('express')();
const http = require("http");
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Mongoose = require('mongoose');

const userSchema = new Mongoose.Schema({
  fname: String,
  lname: String,
  email: String,
  visited: { type: Boolean, default: false }
});

// userSchema.index({ email: 1 }, { unique: 1 })

const UserModel = Mongoose.model("User", userSchema, "users");

const DB_URL = "mongodb://localhost/testapp";

const sendMail = async (to) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "testappemail907@gmail.com",
      pass: 'TestAPP@123'
    }
  });

  const info = await transporter.sendMail({
    from: 'testappemail907@gmail.com',
    to: to,
    subject: "Hello ✔",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
  });
  console.log("Message sent: ", info.messageId);
}


app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  res.sendFile(__dirname + "/views/emailPage.html");
})

app.get('/welcome/:id', async (req, res) => {
  const id = req.param("id");
  try {
    const user = await UserModel.findById(id);
    UserModel.update({
      _id: user._id
    }, {
      $set: {
        visited: true
      }
    })
    if (user) {
      res.send("WELCOME: " + user.fname + " " + user.lname);
    } else {
      res.sendFile(__dirname + "/views/invalidUser.html")
    }
  } catch (error) {
    res.sendFile(__dirname + "/views/invalidUser.html")
  }
})

app.get('/registration_success', async (req, res) => {
  res.send("Successfully registered");
})

app.post("/get_email", async (req, res) => {

  try {
    const newUser = await UserModel.create(req.body);
    console.log("Successfully created new User", newUser._id)
    res.redirect("/registration_success");
  } catch (err) {
    console.log("Error in user creation", err);
  }
});

cron.schedule("0 0 0 * * *", async () => {
  const users = await UserModel.find({
    visited: false
  });
  const userEmails = users.map(i => i.email);
  try {
    await sendMail(userEmails);
  } catch (error) {
    console.error("Error in sending mail", error);
  }
})

Mongoose.connect(DB_URL, (err) => {
  if (!err) {
    console.log("Connected to the DB");
    const server = http.createServer(app);

    server.listen(8080, () => {
      console.log("listening on port:", 8080);
    })
  } else {
    // 
    console.error("error " + err.message);
  }
})

