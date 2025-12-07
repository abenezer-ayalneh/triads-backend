import { Type } from 'class-transformer'
import { Validate, ValidateNested } from 'class-validator'

import { IsFourthTriadCuesValidConstraint } from '../../shared/validators/fourth-triad-cues.validator'
import { TriadInputDto } from './triad-input.dto'

export class CreateTriadGroupDto {
	@ValidateNested()
	@Type(() => TriadInputDto)
	@Validate(IsFourthTriadCuesValidConstraint)
	triad1: TriadInputDto

	@ValidateNested()
	@Type(() => TriadInputDto)
	triad2: TriadInputDto

	@ValidateNested()
	@Type(() => TriadInputDto)
	triad3: TriadInputDto

	@ValidateNested()
	@Type(() => TriadInputDto)
	triad4: TriadInputDto
}
