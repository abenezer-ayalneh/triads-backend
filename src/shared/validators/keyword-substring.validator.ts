import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

interface TriadInputObject {
	keyword?: string
	cues?: string[]
}

@ValidatorConstraint({ name: 'isKeywordSubstringOfCues', async: false })
export class IsKeywordSubstringOfCuesConstraint implements ValidatorConstraintInterface {
	validate(value: unknown, args: ValidationArguments): boolean {
		const object = args.object as TriadInputObject
		const keyword = object.keyword
		const cues = object.cues

		if (!cues || !Array.isArray(cues) || cues.length === 0) {
			return false
		}
		if (!keyword || typeof keyword !== 'string') {
			return false
		}

		// Check if keyword is a substring of each cue
		return cues.every((cue: string) => {
			if (typeof cue !== 'string') {
				return false
			}
			return cue.includes(keyword)
		})
	}

	defaultMessage(args: ValidationArguments): string {
		const object = args.object as TriadInputObject
		const cues = object.cues
		return `Keyword must be a substring of each cue. Cues: ${cues?.join(', ') || 'none'}`
	}
}
