import mongoose, { Schema } from "mongoose"


const skillGapSchema = new Schema({
    skillName: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['high', 'medium', 'low'],
        required: true
    },
    context: {
        type: String,
        required: true
    }
})

const preparationPlanSchema = new Schema({
    timelineType: {
        type: String,
        enum: ['custom_date', 'two_week_standard'],
    },
    daysRemaining: {
        type: Number,
        required: true
    },
    dailySchedule: [
        {
            dayNumber: {
                type: Number,
                required: true
            },
            focusTopic: {
                type: String,
                required: true
            },
            actionItems: [
                {
                    type: String,
                    required: true
                }
            ]
        }
    ]
})

const technicalQuestionSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['technical'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    intent: {
        type: String,
        required: true
    },
    suggestedTalkingPoints: [
        {
            type: String,
            required: true
        }
    ]
})

const behavioralQuestionSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['behavioral'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    intent: {
        type: String,
        required: true
    },
    suggestedTalkingPoints: [
        {
            type: String,
            required: true
        }
    ]

})


const resumeAIAnalysisSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resumeFileUrl: {
        type: String,
        required: true
    },
    analysisTitle: {
        type: String,
        required: true
    },
    matchScore: {
        type: Number,
        required: true
    },
    skillGaps: {
        type: [skillGapSchema],
        required: true
    },
    preparationPlan: {
        type: preparationPlanSchema,
        required: true
    },
    topTechnicalQuestions: {
        type: [technicalQuestionSchema],
        required: true
    },
    topBehavioralQuestions: {
        type: [behavioralQuestionSchema],
        required: true
    }
}, {
    timestamps: true
})

const ResumeAIAnalysis = mongoose.model('ResumeAIAnalysis', resumeAIAnalysisSchema)

export default ResumeAIAnalysis