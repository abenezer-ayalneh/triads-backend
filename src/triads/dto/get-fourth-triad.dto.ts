import { Type } from 'class-transformer'
import { IsNumber } from 'class-validator'

export class GetFourthTriadDto {
	@IsNumber()
	@Type(() => Number)
	triadGroupId: number
}
