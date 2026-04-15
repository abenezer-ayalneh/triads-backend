import { IsInt, Matches, Min } from 'class-validator'

export class CreateDailyScheduleDto {
	/** Eastern calendar date YYYY-MM-DD */
	@Matches(/^\d{4}-\d{2}-\d{2}$/)
	puzzleDate!: string

	@IsInt()
	@Min(1)
	triadGroupId!: number
}
