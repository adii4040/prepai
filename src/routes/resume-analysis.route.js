import { Router } from 'express'

import { analyzeResume, getAllAnalytics, getSingleAnalytic } from '../controllers/resume-analysis.controller.js'

import { verifyJwt } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js'
import { validate, validationSource } from '../middlewares/validate.middlerware.js'
import { validateResumeAnalysis } from '../validators/resumeanalysis.validator.js'



const router = Router()

router.route('/').post(
    verifyJwt,
    upload.single('resume'),
    validate(validateResumeAnalysis, validationSource.BODY),
    analyzeResume
)

router.route('/user').get(
    verifyJwt,
    getAllAnalytics
)

router.route('/user/:analysisId').get(
    verifyJwt,
    getSingleAnalytic
)

export default router