import { IsObject } from 'class-validator'

export class DailyProgressDto {
	@IsObject()
	progress!: Record<string, unknown>
}
