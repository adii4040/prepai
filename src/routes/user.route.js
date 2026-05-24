import { Router } from 'express'

/*--------Controllers------*/
import { registerUser, loginUser, logoutUser, getCurrentUser } from '../controllers/user.controller.js'

/*--------Middlerwares------*/
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { validate, validationSource } from '../middlewares/validate.middlerware.js'

/*--------Validators-------*/
import { validateUserRegisteration, validateUserLogin, emailValidation } from '../validators/user.validator.js'

const router = Router()

router.route('/register').post(validate(validateUserRegisteration, validationSource.BODY), registerUser)

router.route('/login').post(validate(validateUserLogin, validationSource.BODY), loginUser)

//Secured Routes
router.route('/logout').get(verifyJwt, logoutUser)
// router.route('/update').put(verifyJwt, validate(validateUpdateForm, validationSource.BODY) , updateUser)
router.route('/@me').get(verifyJwt, getCurrentUser)



export default router