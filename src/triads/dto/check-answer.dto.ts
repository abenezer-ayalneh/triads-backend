import { IsNotEmpty, IsString } from 'class-validator'

import { Trim } from '../../shared/decorators/trim.decorator'
import { CheckSolutionDto } from './check-solution.dto'

export class CheckAnswerDto extends CheckSolutionDto {
	@Trim()
	@IsString()
	@IsNotEmpty()
	answer: string
}
