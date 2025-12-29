import { Difficulty } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, Validate, ValidateNested } from 'class-validator'

import { IsFourthTriadCuesValidConstraint } from '../../shared/validators/fourth-triad-cues.validator'
import { TriadInputDto } from './triad-input.dto'

export class UpdateTriadGroupDto {
	@Type(() => Number)
	@IsInt()
	id: number

	@ValidateNested()
	@Type(() => TriadInputDto)
	triad1: TriadInputDto

	@ValidateNested()
	@Type(() => TriadInputDto)
	triad2: TriadInputDto

	@ValidateNested()
	@Type(() => TriadInputDto)
	triad3: TriadInputDto

	@ValidateNested()
	@Type(() => TriadInputDto)
	@Validate(IsFourthTriadCuesValidConstraint)
	triad4: TriadInputDto

	@IsEnum(Difficulty, {
		message: 'Difficulty must be one of: EASY, MEDIUM, HARD',
	})
	difficulty: Difficulty
}
