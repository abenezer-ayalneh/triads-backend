import { IsEnum, IsOptional } from 'class-validator'

export enum DifficultyFilter {
	EASY = 'EASY',
	MEDIUM = 'MEDIUM',
	HARD = 'HARD',
	RANDOM = 'RANDOM',
}

export class GetCuesDto {
	@IsOptional()
	@IsEnum(DifficultyFilter, {
		message: 'Difficulty must be one of: EASY, MEDIUM, HARD, RANDOM',
	})
	difficulty?: DifficultyFilter = DifficultyFilter.RANDOM
}
