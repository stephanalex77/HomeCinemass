const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { name } = require("ejs");
const Product = require("../models/productModel");
const nodemailer = require("nodemailer");
const randomString = require("randomstring");
const orders = require("../models/orderModel");

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

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
      otp: 0,
    });

    if (req.body.name.trim() === "" || !req.body.name) {
      return res.status(400).json({ error: "must enter name" });
    }

    const userData = await user.save();
    req.session.email = req.body.email;
    if (userData) {
      const otp = randomString.generate({ length: 4, charset: "numeric" });
      userData.otp = otp;
      await userData.save();

      sendVerifyMail(req.body.name, req.body.email, otp);
      req.session.otp = otp;

      res.render("otp", {
        message: "your registration is successfull",
      });
    } else {
      res.render("registeration", { message: "your registration is failed" });
    }
  } catch (error) {
    console.log(error.massage);
  }
};

const verifyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_varified: 1 } }
    );

    console.log(updateInfo);
    res.render("email-verified");
  } catch (error) {
    console.log(error.message);
  }
};

// login user methods startedconst otp
const loginLoad = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const storedotp = req.session.otp;

    const userData = await User.findOne({ email: req.session.email });
    if (userData) {
      if (otp === storedotp) {
        userData.is_varified = 1;
        await userData.save();
        res.redirect("/");
      } else {
        res.render("otp", { message: "OTP incorrect" });
      }
    } else {
      res.render("login", { message: "user not exist" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("============", email);
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.is_block) {
        res.render("login", { message: "Your account is blocked." });
        return; // Exit the function to prevent further execution
      }

      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_varified === 0) {
          const products = await Product.find();
          res.render("login", { message: "Please verify your mail", products });
        } else {
          console.log("otp verified    :", userData.is_varified);
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
    const products = await Product.find();
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("home", { user: userData, products });
  } catch (error) {
    console.log(error.message);
  }
};

const homeLoad = async (req, res) => {
  try {
    const products = await Product.find();
    res.render("home", { products });
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

const generateOtp = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    res.render("otp");
  } catch (error) {
    console.log(error.message);
  }
};



const goToProfile = async (req, res) => {
  try {
    if (req.session && req.session.user_id) {
      const userId = req.session.user_id; // Adjust the key based on what you set in your session
      const user = await User.findOne({ _id: userId });
      const ord = await orders.find({ userId: user }).populate("user");
      if (user) {
        // console.log(user); // Check user data in the console
        res.render("userProfile", { user, addresses: user.address, ord: ord });
      } else {
        console.log("User not found");
        res.status(404).send("User not found");
      }
    } else {
      console.log("User session not found");
      res.status(401).redirect("/login");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


// ADD ADDRESS TO USER PROFILE
const addAddressToProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    // console.log(user);

    const { address1, address2, pincode, state, city, country } = req.body;
    console.log(address1);
    const newAddress = {
      address1,
      address2,
      pincode,
      state,
      city,
      country,
    };
    // console.log(newAddress);
    user.address.push(newAddress);

    // user.markModified('address');

    await user.save();

    res.json({ success: true, message: 'Address added successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'An error occurred while adding the address' });
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.session.user_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirmation do not match' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const deleteAddress =(req, res) => {
  const index = req.params.index;
  
  if (index >= 0 && index < addresses.length) {
    addresses.splice(index, 1);
    res.json({ message: 'Address deleted successfully' });
  } else {
    res.status(404).json({ message: 'Address not found' });
  }
};

module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  verifyOtp,
  loadHome,
  homeLoad,
  userLogout,
  updateProfile,
  generateOtp,
  verifyMail,
  goToProfile,
  addAddressToProfile,
  changePassword,
  deleteAddress
};
