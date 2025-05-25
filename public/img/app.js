// const express=require('express');
// const app=express();
// const port=process.env.PORT || 5000;
// require("./db/conn");
// const Register=require("./models/usermessage");
// const path=require("path");
// const hbs = require('hbs');
// const templatepath=path.join(__dirname,"../templat/views");
// const partialpath=path.join(__dirname,"../templat/partials");
// app.use(express.json());
// app.use(express.urlencoded({extended:true}));
// app.use(express.static(path.join(__dirname, "../public/img")));
// app.set("view engine","hbs");
// app.set("views",templatepath);
// hbs.registerPartials(partialpath);
// app.get("/get-started", (req, res) => {
// res.render("registers");
//   });
// app.get("/register",(req,res)=>{
//     res.render("registers");
// })
// app.post("/register",async(req,res)=>{
//     try{
//         const user=new Register(req.body);
//         await user.save();
//         res.status(201).render("index");
//     }
//     catch(error){
//         res.status(400).send(error);
//     }
// })

// app.get("/",(req,res)=>{
//     res.render("index");
// })
// app.get("/About-Home",(req,res)=>{
//     res.render("About-Home");
// })

// app.listen(port,()=>{
//     console.log(`server is running on port ${port}`);
// })
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const session = require('express-session');
const bcrypt = require('bcrypt');
require("./db/conn");
const Register = require("./models/usermessage");
const path = require("path");
const hbs = require('hbs');

const templatepath = path.join(__dirname, "../templat/views");
const partialpath = path.join(__dirname, "../templat/partials");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public/img")));

// Session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.set("view engine", "hbs");
app.set("views", templatepath);
hbs.registerPartials(partialpath);

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/"); // Redirect to home if already logged in
    }
    next();
};

// Home route
app.get("/", (req, res) => {
    if (req.session.user) {
        res.render("index", { loggedIn: true, username: req.session.user.name });
    } else {
        res.render("index", { loggedIn: false });
    }
});

// Get Started route
app.get("/get-started", isAuthenticated, (req, res) => {
    res.render("registers", { message: "" });
});

// Auth route (POST) - Handles both login and register
app.post("/auth", async (req, res) => {
    try {
        const { name, email, password, action } = req.body; // 'action' will be 'login' or 'register'
        
        if (action === "register") {
            const existingUser = await Register.findOne({ email });
            if (existingUser) {
                return res.render("registers", { message: "User already exists. Please login." });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new Register({ name, email, password: hashedPassword });
            await user.save();
            req.session.user = { name, email };
            res.redirect("/");
        } else if (action === "login") {
            const user = await Register.findOne({ email });
            if (!user) {
                return res.render("registers", { message: "User not found. Please register." });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.render("registers", { message: "Invalid credentials." });
            }
            req.session.user = { name: user.name, email: user.email };
            res.redirect("/");
        }
    } catch (error) {
        res.status(400).render("registers", { message: "An error occurred." });
    }
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.get("/About-Home", (req, res) => {
    res.render("About-Home");
});
app.get("/Home-Cinema",(req,res)=>{
    res.render("Home-Cinema");
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});