import { asyncHandler } from '../Utils/AsyncHandler.utils.js'
import { ApiResponse } from '../Utils/ApiResponse.utils.js'
import { ApiError } from '../Utils/ApiError.utils.js'
import { resumeAiAnalysisService } from '../services/resume_analysis.service.js'
import { extractResumeText } from '../services/pdf_parser.service.js'
import ResumeAIAnalysis from '../models/resume-ai-analysis.model.js'
import { uploadOnCloudinary } from "../utils/Cloudinary.utils.js"


const analyzeResume = asyncHandler(async (req, res) => {
    const { selfDescription, jobDescription, interviewDate } = req.body
    const userId = req.user._id

    if (!req.file) throw new ApiError(400, 'Resume file is required!!')

    const resumeFile = req.file
    const cloudinaryResumeFileUrl = await uploadOnCloudinary(resumeFile.path)

    const resumeText = await extractResumeText(cloudinaryResumeFileUrl.secure_url)

    let timelinePromptContext = "";
    const today = new Date();

    if (interviewDate) {
        const interview = new Date(interviewDate);
        const diffTime = interview.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        timelinePromptContext = `The user has an interview scheduled in exactly ${diffDays} days (on ${interviewDate}). You MUST construct a highly custom, aggressive preparation schedule starting from Day 1 all the way up to Day ${diffDays}.`;
    } else {
        timelinePromptContext = `No interview date was provided. You MUST generate a standard, foundational 14-day (2 weeks) daily preparation plan containing exactly 14 sequential entries.`;
    }

    console.log('FTECHED THE TIMELINE PROMPT CONTEXT...')
    const ai_result = await resumeAiAnalysisService({
        jobDescription,
        resumeText,
        selfDescription,
        timelinePromptContext
    })

    const analysisRecord = await ResumeAIAnalysis.create({
        userId,
        analysisTitle: ai_result.analysisTitle,
        resumeFileUrl: cloudinaryResumeFileUrl.secure_url,
        matchScore: ai_result.matchScore,
        skillGaps: ai_result.skillGaps,
        preparationPlan: ai_result.preparationPlan,
        topTechnicalQuestions: ai_result.topTechnicalQuestions,
        topBehavioralQuestions: ai_result.topBehavioralQuestions
    })

    console.log(analysisRecord)
    if (!analysisRecord) throw new ApiError(500, 'Failed to save analysis record to the database!!')

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                analysisRecord,
            },
            'Resume analyzed successfully!'
        )
    )
})

const getAllAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const analysisRecords = await ResumeAIAnalysis.find({ userId }).sort({ createdAt: -1 }).select('-skillGaps -preparationPlan -topTechnicalQuestions -topBehavioralQuestions')
    if (!analysisRecords) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    analysisRecords: [],
                },
                'No analysis records found for the user.'
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                analysisRecords,
            },
            'Analytics retrieved successfully!'
        )
    )
})

const getSingleAnalytic = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { analysisId } = req.params

    if (!analysisId) throw new ApiError(400, 'Analysis ID is required!!')

    const analysisRecord = await ResumeAIAnalysis.findOne({ _id: analysisId, userId })
    if (!analysisRecord) throw new ApiError(404, 'Analysis record not found!!')

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                analysisRecord,
            },
            'Analysis record retrieved successfully!'
        )
    )
})

export {
    analyzeResume,
    getAllAnalytics,
    getSingleAnalytic
}