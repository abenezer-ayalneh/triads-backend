import { Type } from 'class-transformer'
import { IsInt } from 'class-validator'

export class DeleteTriadGroupDto {
	@Type(() => Number)
	@IsInt()
	id: number
}
