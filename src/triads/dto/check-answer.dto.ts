import { IsNotEmpty, IsString } from 'class-validator'

import { CheckSolutionDto } from './check-solution.dto'

export class CheckAnswerDto extends CheckSolutionDto {
	@IsString()
	@IsNotEmpty()
	answer: string
}
