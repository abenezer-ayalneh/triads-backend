import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

interface TriadInputDto {
	keyword: string
	fullPhrases: string[]
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

		// Get fullPhrases from fourth triad
		const fullPhrases4 = triad4.fullPhrases

		if (!keyword1 || !keyword2 || !keyword3 || !fullPhrases4 || !Array.isArray(fullPhrases4) || fullPhrases4.length !== 3) {
			return false
		}

		// Extract cues from fullPhrases by removing the keyword from each phrase (case-insensitive)
		// Example: keyword="STOCK", fullPhrases=["OVERSTOCK","STOCK EXCHANGE","WOODSTOCK"]
		// Result: cues=["OVER","EXCHANGE","WOOD"]
		// Check if keywords of first three triads match the cues extracted from fullPhrases of the fourth triad
		// Convert to uppercase for case-insensitive comparison
		const expectedCues = [keyword1.toUpperCase(), keyword2.toUpperCase(), keyword3.toUpperCase()].sort()
		const keyword4 = triad4.keyword
		const keyword4Upper = keyword4.toUpperCase()
		const actualCues = fullPhrases4
			.map((phrase: string) => {
				const phraseUpper = phrase.toUpperCase()
				let cue = phrase
				// Check startsWith before endsWith so "EVEN STEVEN" yields "STEVEN" (not "EVEN ST")
				if (phraseUpper.startsWith(keyword4Upper + ' ')) {
					cue = phrase.slice(keyword4.length + 1).trim()
				} else if (phraseUpper.startsWith(keyword4Upper)) {
					cue = phrase.slice(keyword4.length).trim()
				} else if (phraseUpper.endsWith(keyword4Upper)) {
					const beforeKeyword = phrase.slice(0, -keyword4.length)
					const lastChar = beforeKeyword.slice(-1)
					if (lastChar === '-' || lastChar === ' ' || lastChar === '_') {
						cue = beforeKeyword.slice(0, -1).trim()
					} else {
						cue = beforeKeyword.trim()
					}
				} else if (phraseUpper.includes(keyword4Upper)) {
					const index = phraseUpper.indexOf(keyword4Upper)
					cue = (phrase.slice(0, index) + phrase.slice(index + keyword4.length)).trim()
				}
				return cue.toUpperCase()
			})
			.sort()

		return expectedCues.every((keyword, index) => keyword === actualCues[index])
	}

	defaultMessage(): string {
		return 'Keywords of triad1, triad2, and triad3 must match the cues extracted from fullPhrases of triad4'
	}
}
