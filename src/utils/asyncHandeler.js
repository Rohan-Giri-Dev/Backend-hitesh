const asyncHandeler = (requestHandeler)=>{
        (req, res, next) =>{
            Promise
            .resolve(requestHandeler(req, res, next))
            .catch((err) => next(err))
        }
}

export {asyncHandeler}



/*
Usuing Async
const asyncHandeler = (fn) => async(req, res, next) =>{
    try {
        
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
        
    }
}
*/