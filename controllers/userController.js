const User = require("../models/userModel");
const Cart = require("../models/cartModel")
const bcrypt = require("bcrypt");
const { name, render } = require("ejs");
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


const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
 }
};


const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_Verified) {
        res.render("forget", { message: "please verify your mail.." });
      } else {
        const otp = randomString.generate({ length: 4, charset: "numeric" });
        console.log(otp);
        delete req.session.otp
        req.session.otp = otp;
        await sendResetPasswordMail(userData.name, userData.email, otp);
        res.render('forgetOtp',{userId:userData.id});
        // res.render("otp",{userId:userData})
      }
    } else {
      res.render("forget", { message: "user not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/404")
  }
};

const sendResetPasswordMail = async(name,email,otp)=>{
  try{
      const transporter = nodemailer.createTransport({
          host:'smtp.gmail.com',
          port:587,
          secure:false,
          requireTLS:true,
          auth:{
            user: "stephanalex22@gmail.com",
            pass: "jrdjzrshqrxkgckm",
          }
      });
      const mailOptions = {
          from:"stephanalex22@gmail.com",
          to:email,
          subject:'for reset password',
          html: '<p>Hyy '+name+" "+"this is your verify opt " +"  "+  otp+' "</p>'
      }
      transporter.sendMail(mailOptions,function(error,info){
          if(error){
              console.log(error);
          }
          else{
              console.log("email has been sent :-",info.response);
          }
      })
      
  }catch(error){
      console.log(error.message);
  }
}


const verifyOtpLoad = async (req, res) => {
  try {
    res.render("forgetOtp", { userId: req.query.id });
  } catch (error) {
    console.log(error.message);
 }
};

const verifyResetOtp = async (req, res) => {
  try {

    const enteredOTP = req.body.otp
    console.log(enteredOTP,"========");
    const saveOtp = req.session.otp;
    if (saveOtp === enteredOTP) {
      const id = req.body.userId.trim();
      res.status(200).json({ success:true, message:"verification successfull",userId:id });
    } else {
      // const userData = await User.findById(req.body.userId);
      // console.log(userData);
      res.status(400).json({success:false,message:"OTP incorrect"})
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async(req,res)=>{
  try{
    const userId = req.query.id
   
    res.render('forgotPassword',{userId:userId})
  }catch(error){
    console.log(error);
 }
}

const resetNewPassword = async (req, res) => {
  try {
    const user_id = req.body.userId
    const password = req.body.password;
    const passwordHash = await bcrypt.hash(password,10)
    const secure_password = passwordHash
    const updateData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password } }
    );

    console.log(updateData);
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
 }
};

const resendForget = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findOne({id:userId})
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const newOTP = randomString.generate({ length: 4, charset: "numeric" });
    console.log(newOTP ,"newotp")
    await sendResetPasswordMail(user.name, user.email, newOTP);
    delete req.session.otp
    req.session.otp = newOTP
    return res.json({ success: true, message: "OTP Resent"});
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error resending OTP" });
  }
};


const loadHome = async (req, res) => {
  try {
    const products = await Product.find();
    const userData = await User.findById({ _id: req.session.user_id });
    const userId = req.session.user_id;

    const cart = await Cart.findOne({ user: userId });
    
    
    res.render("home", { user: userData, products, cart });
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
    delete req.session.user_id;
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
      const Order = await orders.find({ userId: user }).populate("user");

      
      console.log(user.address);
      if (user) {
        // console.log(user); // Check user data in the console
        res.render("userProfile", { user, addresses: user.address, orders });

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

    const { address1, address2, pincode, state, city, country } = req.body;
    
    const newAddress = {
      address1,
      address2,
      pincode,
      state,
      city,
      country,
    };

    // Check if it's the first address or if you want to make it default
    if (user.address.length === 0 || req.body.makeDefault) {
      user.defaultAddressIndex = user.address.length;
    }

    user.address.push(newAddress);
    await user.save();

    res.json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the address",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findById(req.session.user_id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password and confirmation do not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();
    const successMessage = "Password changed successfully";

    // Send a JSON response with the success message
    return res.status(200).json({ success: true, message: successMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




const deleteAddress = async (req, res) => {
  const userId = req.params.userId;
  const addressId = req.params.addressId;
  // console.log(userId);
  // console.log(addressId);
  try {
    // Find the user by their ID
    const user = await User.findById(userId);

    if (!user || !user.address) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Find the index of the address to delete in the user's address array
    const addressIndex = user.address.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // Remove the address from the user's address array
    user.address.splice(addressIndex, 1);

    // Save the updated user
    await user.save();

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the address",
    });
  }
};

const loadDefaultAddress = async (req, res) => {
  try {
      const userId = req.session.user._id
      const user = await User.findById(userId)
      res.render('defaultAddress', { user })
  } catch (error) {
      res.status(500).send("Address Not availble");
  }
}


const makeDefaultAddress = async (req, res) => {
  // const id = req.query.addressId
  // console.log("========",id);

  try {
    // console.log("response from backend")
      const userId = req.session.user_id;
      // console.log("sdfghjk",userId);
      const addressIdToSetDefault = req.query.addressId;
      // console.log(addressIdToSetDefault);

      await User.updateOne(
          { _id: userId, 'address.is_default': true },
          { $set: { 'address.$.is_default': false } }
      );


      await User.updateOne(
          { _id: userId, 'address._id': addressIdToSetDefault },
          { $set: { 'address.$.is_default': true } }
      );

      res.json({ message: "Default address set successfully" });
  } catch (error) {
      console.error('Error setting default address:', error);
      res.status(500).send("An error occurred while setting the default address");
  }
}

const loadEditAddress = async (req, res) => {
  try {
    // Get the address ID from the query parameters
    const addressId = req.query.addressId;
    console.log("which address:::", addressId);
    // Fetch the user's address data from the database
    const user = await User.findById(req.session.user_id);
    console.log("who is the user:::", user);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the specific address within the user's address array
    const address = user.address.find((addr) => addr._id.toString() === addressId);
    console.log(":::::",address );
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Render the 'editAddress' view and pass the address data
    res.render('editAddress', { userAddress: address, user });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};





const mongoose = require('mongoose');

const editAddress = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const addressId = new mongoose.Types.ObjectId(req.params.addressId);

    const { editAddressLine1, editAddressLine2, editCity, editPincode, editState, editCountry } = req.body; // Add more fields as needed

    // Find the user by ID and the address to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the address in the user's address array by ID
    const addressToUpdate = user.address.id(addressId);
    if (!addressToUpdate) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Update the address fields
    if (editAddressLine1) {
      addressToUpdate.address1 = editAddressLine1;
    }
    if (editAddressLine2) {
      addressToUpdate.address2 = editAddressLine2;
    }
    if (editCity) {
      addressToUpdate.city = editCity;
    }
    if (editPincode) {
      addressToUpdate.pincode = editPincode;
    }
    if (editState) {
      addressToUpdate.state = editState;
    }
    if (editCountry) {
      addressToUpdate.country = editCountry;
    }

    // Save the updated user
    await user.save();

    // return res.status(200).json({ success: true, message: 'Address updated successfully' });
    res.redirect("/profile")
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const loadChangePassword = async (req, res)=>{
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
      console.log(user);
      res.render('changePassword', {user})
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  verifyOtp,
  forgetLoad,
  forgetVerify,
  verifyOtpLoad,
  verifyResetOtp,
  resetPassword,
  resetNewPassword,
  resendForget,
  loadHome,
  homeLoad,
  userLogout,
  updateProfile,
  generateOtp,
  verifyMail,
  goToProfile,
  addAddressToProfile,
  changePassword,
  deleteAddress,
  loadDefaultAddress,
  makeDefaultAddress,
  loadEditAddress,
  editAddress,
  loadChangePassword

};
