const isLoggedIn = async(req,res,next) => {
    try {
        if(req.session.user){
            
        }
        else{
            res.redirect('/login');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}
const isLoggedOut = async(req, res,next) => {
    try {
        if(req.session.user){
            res.redirect('/dashboard');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}
module.exports={
    isLoggedIn,
    isLoggedOut
}