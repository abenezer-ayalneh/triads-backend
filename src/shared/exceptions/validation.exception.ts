import { HttpStatus } from '@nestjs/common'
import { ValidationError } from 'class-validator'

export interface ValidationErrorItem {
	field: string
	errors: Record<string, string> | undefined
}

function flattenValidationErrors(errors: ValidationError[], parent = ''): ValidationErrorItem[] {
	const flattened: ValidationErrorItem[] = []

	for (const error of errors) {
		const fieldPath = parent ? `${parent}.${error.property}` : error.property

		if (error.constraints) {
			flattened.push({
				field: fieldPath,
				errors: error.constraints,
			})
		}

		if (error.children?.length) {
			flattened.push(...flattenValidationErrors(error.children, fieldPath))
		}
	}

	return flattened
}

export default class ValidationException {
	private readonly error: string

	private readonly message: ValidationErrorItem[]

	private readonly statusCode: number

	constructor(validationErrors: ValidationError[]) {
		this.error = 'Validation Error'
		this.message = flattenValidationErrors(validationErrors)
		this.statusCode = HttpStatus.UNPROCESSABLE_ENTITY
	}

	get getError(): string {
		return this.error
	}

	get getMessage(): ValidationErrorItem[] {
		return this.message
	}

	get getStatusCode(): number {
		return this.statusCode
	}
}
