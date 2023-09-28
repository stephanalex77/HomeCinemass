const isLogin = async(req,res,next)=>{
  try{
      if(req.session.admin_id){
        next();
      }else{
      return  res.redirect('/admin');
      }
      
  }catch (error){
      console.log(error.message);
  }
}
const isLogout = async(req,res,next)=>{
 try{
  if(req.session.admin_id){
    return  res.redirect('/admin/home');
  }
  next();

 } catch(error){
  console.log(error.message);
 }
}

module.exports = {
  isLogin,
  isLogout
}




module.exports = {
    isLogin,
    isLogout
};