const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const loadLogin = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;

    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
        

      const passwordMatch = bcrypt.compare(password, userData.password);
      
      if (passwordMatch) {
        if (userData.is_admin === false) {
          res.render("login", { message: "Email and password is incorrect" });
        } else {
          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
        }
      }
    } else {
      res.render("login", { message: "Email and password is incorrect." });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    res.set("cache-Control", "no-store");
    res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.render("user", { users });
  } catch (error) {
    console.log(error.message);
  }
};

// Handle toggle button state changes
// const user_toggle = async (req, res) => {
//     const userId = mongoose.Types.ObjectId(req.body._Id);

//     try {
//         const user = await User.findOne({ _id: userId });

//         if (user) {
//             user.active = !user.active;
//             await user.save(); // Save the updated user document
//             res.json({ success: true, active: user.active });
//         } else {
//             res.status(404).json({ success: false, message: 'User not found' });
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };
//

//     const user_toggle = async (req, res) => {
//         console.log('User ID from request:', req.body._id);
// console.log('is_block from request:', req.body.is_block);

//         const userId = new mongoose.Types.ObjectId(req.body._id);
//         const is_block = req.body.is_block; // Use the correct field name

//         try {
//             const user = await User.findOne({ _id: userId });

//             if (user) {
//                 user.is_block = is_block; // Use the correct field name
//                 await user.save();
//                 res.json({ success: true, is_blocked: user.is_block }); // Use the correct field name
//             } else {
//                 res.status(404).json({ success: false, message: 'User not found' });
//             }
//         } catch (error) {
//             console.error(error.message);
//             res.status(500).json({ success: false, message: 'Internal server error' });
//         }
//     };

const blockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    const userUpdate = await User.updateOne(
      { _id: userId },
      { $set: { is_block: true } }
    );

    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

const unblockuser = async (req, res) => {
  try {
    const userId = req.query.id;
    await User.updateOne({ _id: userId }, { $set: { is_block: false } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const userData = await User.find({
      is_admin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    });
    res.render("user", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      res.redirect("/admin/productList");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const updateUsers = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.eamil,
          mobile: req.body.mno,
          is_varified: req.body.verify,
        },
      }
    );

    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error.message);
  }
};




module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  getUsers,
  blockUser,
  unblockuser,
  adminDashboard,
  editUserLoad,
  updateUsers,

};
