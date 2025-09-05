import { ArrayMaxSize, ArrayMinSize, ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator'

export class CheckAnswerDto {
	@IsArray() // Ensures the property is an array
	@ArrayNotEmpty() // Ensures the array is not empty
	@IsString({ each: true }) // Ensures every element in the array is a string
	@ArrayMinSize(3) // Ensures the array contains at least three entries
	@ArrayMaxSize(3) // Ensures the array contains at most three entries
	cues: string[]

	@IsString()
	@IsNotEmpty()
	answer: string
}
