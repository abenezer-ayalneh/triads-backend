import { Difficulty } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class GetTriadGroupsDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number = 0

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20

	@IsOptional()
	@IsString()
	search?: string

	@IsOptional()
	@IsEnum(Difficulty, {
		message: 'Difficulty must be one of: EASY, MEDIUM, HARD',
	})
	difficulty?: Difficulty
}
