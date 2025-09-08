import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, ArrayNotEmpty, IsArray, IsNumber } from 'class-validator'

export class GetFourthTriadDto {
	@IsNumber({}, { each: true }) // Ensures every element in the array is a number
	@Type(() => Number)
	@ArrayMinSize(3) // Ensures the array contains at least three entries
	@ArrayMaxSize(3) // Ensures the array contains at most three entries
	@ArrayNotEmpty() // Ensures the array is not empty
	@IsArray() // Ensures the property is an array
	triadsIds: number[]
}
