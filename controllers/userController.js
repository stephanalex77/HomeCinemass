const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { name } = require("ejs");

const nodemailer = require("nodemailer");
const randomString= require("randomstring");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
//for send mail

const sendVerifyMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "stephanalex22@gmail.com",
        pass: "jrdjzrshqrxkgckm",
      },
    });
    console.log(otp);
    const mailOptions = {
      from: "stephanalex22@gmail.com",
      to: email,
      subject: "for varification mail",
      html:
        "<p>Hello " + name + " " + "this is your otp " + "  " + otp + ' "</p>',
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};




const loadRegister = async (req, res) => {
  try {
    res.render("registeration");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);

    const existEmail = await User.findOne({ email: req.body.email });

    if (existEmail) {
      return res.status(400).json({ error: "Email already exists." });
    }
    //  function generateOtp(

    //  )
    // const otp=generateOtp()

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
    });

    console.log(user);
    if (req.body.name.trim() === "" || !req.body.name) {
      return res.status(400).json({ error: "must enter name" });
    }

    const userData = await user.save();
    console.log("jfgs");
    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);

      res.render("registeration", {
        message: "your registration is successfull",
      });
    } else {
      res.render("registeration", { message: "your registration is failed" });
    }
  } catch (error) {
    console.log(error.massage);
  }
};

// const verifyMail = async (req, res) => {
//   try {
//     const updateInfo = await User.updateOne(
//       { _id: req.query.id },
//       { $set: { is_varified: 1 } }
//     );

//     console.log(updateInfo);
//     res.render("email-verified");
//   } catch (error) {
//     console.log(error.message);
//   }
// };




// login user methods started
const loginLoad = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async(req, res) =>{
  try{
    const email = req.body.email;
    const otp = req.body.otp;

    const userData = await User.findOne({email: email});
    if (userData) {
      if (userData.otp===otp) {
        if (userData.is_varified === 0) {
          res.render("login", { message: "Please verify your mail" });
        } else {
          req.session.user = userData;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "OTP incorrect" });
      }
    } else {
      res.render("login", { message: "user not exist" });
    }
  } catch (error) {
    console.log(error.message);
  }
}

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_varified === 0) {
          res.render("login", { message: "Please verify your mail" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "Login failed" });
      }
    } else {
      res.render("login", { message: "Login failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.set("cache-Control", "no-store");
    res.render("home", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// const editLoad = async (req, res) => {
//   try {
//     const id = req.query.id;

//     const userData = await User.findById({ _id: id });

//     if (userData) {
//       res.render("edit", { user: userData });
//     } else {
//       res.redirect("/home");
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            image: req.file.filename,
          },
        }
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
          },
        }
      );
    }

    if (req.body.name.trim() === "" || !req.body.name) {
      return res.status(400).json({ error: "Must enter name" });
    }
    if (req.body.email.trim() === "" || !req.body.email) {
      return res.status(400).json({ error: "Must enter email" });
    }
    if (req.body.mobile.trim() === "" || !req.body.mobile) {
      return res.status(400).json({ error: "Must provide contact number" });
    }
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

const getOtp = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    res.render("otpGenerate");
  } catch (error) {
    console.log(error.message);
  }
};


const sendOtp= async (req, res) => {
  try {
    // userData._id=req.session.user_id 
    // console.log(userData._id)
 
    const userData= await User.findOne({email:req.body.email})
 
    const  otp = randomString.generate({length:4,charset:"numeric"})

   
    sendVerifyMail( userData['name'],req.body.email,otp);
    res.render("otp");
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  verifyOtp,
  loadHome,
  userLogout,
  updateProfile,
  getOtp,
  sendOtp
};
