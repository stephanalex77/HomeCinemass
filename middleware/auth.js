const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      next();
    } else {
     return res.redirect('/login'); // Redirect the user to the login page if not logged in
    }
  } catch (error) {
    console.log(error.message);
  }
};


const isLogout = async(req,res,next)=>{
  try{
if(req.session.user_id){
return res.redirect('/home')
}
next();
  }catch(error){
  console.log(error.message);
  }
}

module.exports= {
  isLogin,
  isLogout
}