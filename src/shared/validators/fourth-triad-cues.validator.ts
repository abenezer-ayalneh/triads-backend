import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

interface TriadInputDto {
	keyword: string
	cues: string[]
}

interface TriadGroupInputObject {
	triad1?: TriadInputDto
	triad2?: TriadInputDto
	triad3?: TriadInputDto
	triad4?: TriadInputDto
}

@ValidatorConstraint({ name: 'isFourthTriadCuesValid', async: false })
export class IsFourthTriadCuesValidConstraint implements ValidatorConstraintInterface {
	validate(value: unknown, args: ValidationArguments): boolean {
		const object = args.object as TriadGroupInputObject
		const triad1 = object.triad1
		const triad2 = object.triad2
		const triad3 = object.triad3
		const triad4 = object.triad4

		// Ensure all triads exist
		if (!triad1 || !triad2 || !triad3 || !triad4) {
			return false
		}

		// Get keywords from first three triads
		const keyword1 = triad1.keyword
		const keyword2 = triad2.keyword
		const keyword3 = triad3.keyword

		// Get cues from fourth triad
		const cues4 = triad4.cues

		if (!keyword1 || !keyword2 || !keyword3 || !cues4 || !Array.isArray(cues4) || cues4.length !== 3) {
			return false
		}

		// Check if keywords of first three triads match the cues of the fourth triad
		const expectedCues = [keyword1, keyword2, keyword3].sort()
		const actualCues = [...cues4].sort()

		return expectedCues.every((keyword, index) => keyword === actualCues[index])
	}

	defaultMessage(): string {
		return 'Keywords of triad1, triad2, and triad3 must match the cues of triad4'
	}
}
