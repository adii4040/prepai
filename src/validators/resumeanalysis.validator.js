import { z } from 'zod'

const optionalInterviewDate = z.preprocess((value) => {
	if (value === '' || value === null || value === undefined) {
		return undefined
	}

	return value
}, z.coerce.date().optional())

export const validateResumeAnalysis = z.object({
	selfDescription: z
		.string()
		.trim()
		.min(1, { message: 'Self description is required' }),
	jobDescription: z
		.string()
		.trim()
		.min(1, { message: 'Job description is required' }),
	interviewDate: optionalInterviewDate.refine((date) => {
		if (!date) return true

		const tomorrow = new Date()
		tomorrow.setHours(0, 0, 0, 0)
		tomorrow.setDate(tomorrow.getDate() + 1)

		return date >= tomorrow
	}, {
		message: 'Interview date must be tomorrow or later'
	})
})
