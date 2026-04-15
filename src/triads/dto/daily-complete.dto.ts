import { IsIn, IsInt, Max, Min } from 'class-validator'

export class DailyCompleteDto {
	@IsIn(['won', 'lost'])
	outcome!: 'won' | 'lost'

	@IsInt()
	@Min(0)
	@Max(15)
	score!: number
}
