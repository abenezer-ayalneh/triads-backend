import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to remove the keyword once and trim surrounding whitespace
function removeKeyword(phrase: string, keyword: string): string {
	return phrase.replace(keyword, '').trim()
}

async function main() {
	const entries: { keyword: string; fullPhrases: string[] }[] = [
		{ keyword: 'FUND', fullPhrases: ['SLUSH FUND', 'TRUST FUND', 'HEDGE FUND'] },
		{ keyword: 'AID', fullPhrases: ['FIRST AID', 'KITCHENAID', 'PREPAID'] },
		{ keyword: 'FRIEND', fullPhrases: ['CLOSE FRIEND', 'FRIENDSHIP', 'IMAGINARY FRIEND'] },
		{ keyword: 'MUTUAL', fullPhrases: ['MUTUAL FUND', 'MUTUAL FRIEND', 'MUTUAL AID'] },
		{ keyword: 'BUTT', fullPhrases: ['BUTT CRACK', 'CIGARETTE BUTT', 'KICK BUTT'] },
		{ keyword: 'AMERICAN', fullPhrases: ['AMERICAN IDOL', 'AMERICAN DREAM', 'PANAMERICAN'] },
		{ keyword: 'RUMOR', fullPhrases: ['RUMORMONGER', 'RUMOR MILL', 'NASTY RUMOR'] },
		{ keyword: 'UGLY', fullPhrases: ['BUTT UGLY', 'UGLY RUMOR', 'UGLY AMERICAN'] },
		{ keyword: 'CONTROL', fullPhrases: ['CONTROL KEY', 'CONTROL TOWER', 'RENT CONTROL'] },
		{ keyword: 'PROPERTY', fullPhrases: ['PUBLIC PROPERTY', 'PROPERTY TAX', 'PROPERTY RIGHTS'] },
		{ keyword: 'BRAIN', fullPhrases: ['BRAIN FART', 'BRAINWASH', 'HAREBRAIN'] },
		{ keyword: 'DAMAGE', fullPhrases: ['DAMAGE CONTROL', 'BRAIN DAMAGE', 'PROPERTY DAMAGE'] },
		{ keyword: 'CAMP', fullPhrases: ['CAMP SITE', 'CAMP DAVID', 'CAMP STOOL'] },
		{ keyword: 'LEG', fullPhrases: ['PEG LEG', 'CHICKEN LEG', 'LEG IRONS'] },
		{ keyword: 'SKI', fullPhrases: ['SKI PATROL', 'JET SKI', 'SKI JUMP'] },
		{ keyword: 'BOOT', fullPhrases: ['BOOT CAMP', 'BOOTLEG', 'SKI BOOT'] },
		{ keyword: 'UPPER', fullPhrases: ['UPPER HAND', 'UPPER CLASS', 'UPPER DECK'] },
		{ keyword: 'CHERRY', fullPhrases: ['CHERRY BLOSSOM', 'BING CHERRY', 'CHERRY PICK'] },
		{ keyword: 'NOSE', fullPhrases: ['NOSEDIVE', 'NOSE JOB', 'BLOODY NOSE'] },
		{ keyword: 'PICKER', fullPhrases: ['NOSE-PICKER', 'CHERRY PICKER', 'PICKER-UPPER'] },
	]

	for (const e of entries) {
		const cues = e.fullPhrases.map((p) => removeKeyword(p, e.keyword))

		await prisma.triad.create({
			data: {
				keyword: e.keyword,
				cues,
				fullPhrases: e.fullPhrases,
			},
		})
	}
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
