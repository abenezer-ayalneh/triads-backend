import { Type } from 'class-transformer'
import { IsBoolean, IsInt } from 'class-validator'

export class UpdateTriadGroupActiveDto {
	@Type(() => Number)
	@IsInt()
	id: number

	@IsBoolean()
	active: boolean
}
