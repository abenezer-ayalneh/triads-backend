import { Injectable } from '@nestjs/common'
import { isEmpty, xor } from 'lodash'

import { PrismaService } from '../prisma/prisma.service'
import { GetFourthTriadDto } from './dto/get-fourth-triad.dto'
import { GetHintDto } from './dto/get-hint.dto'

@Injectable()
export class TriadsService {
	constructor(private readonly prismaService: PrismaService) {}

	async getCues() {
		// Optimized query using JOINs instead of nested subqueries for better performance
		const randomTriadCues = await this.prismaService.$queryRawUnsafe<{ id: number; triad1: string[]; triad2: string[]; triad3: string[] }[]>(`
			SELECT 
				tg.id,
				t1.cues as triad1,
				t2.cues as triad2,
				t3.cues as triad3
			FROM "triadGroups" tg
			INNER JOIN "triads" t1 ON t1.id = tg."triad1Id"
			INNER JOIN "triads" t2 ON t2.id = tg."triad2Id"
			INNER JOIN "triads" t3 ON t3.id = tg."triad3Id"
			ORDER BY random()
			LIMIT 1;
		`)

		if (!randomTriadCues || randomTriadCues.length === 0) {
			throw new Error('No triad groups found in database')
		}

		const randomTriadCue = randomTriadCues[0]
		if (!randomTriadCue.triad1 || !randomTriadCue.triad2 || !randomTriadCue.triad3) {
			throw new Error('Invalid triad group data')
		}

		return [...randomTriadCue.triad1, ...randomTriadCue.triad2, ...randomTriadCue.triad3].sort(() => Math.random() - 0.5)
	}

	async getMatchedTriad(cues: string[]): Promise<{ id: number; keyword: string; cues: string[]; fullPhrases: string[] } | undefined> {
		const sampleCue = cues[0]

		// Limit results to prevent loading all triads into memory
		const triadsContainingSampleCue = await this.prismaService.triad.findMany({
			where: { cues: { has: sampleCue.toUpperCase() } },
			take: 1000, // Reasonable limit to prevent memory issues
		})

		return triadsContainingSampleCue.find((triad) =>
			isEmpty(
				xor(
					triad.cues.map((cue) => cue.toUpperCase()),
					cues.map((cue) => cue.toUpperCase()),
				),
			),
		)
	}

	checkAnswer(answer: string, triad: { id: number; keyword: string; cues: string[]; fullPhrases: string[] }) {
		return triad.keyword.toUpperCase() === answer.toUpperCase() ? triad : false
	}

	async getHint(getHintDto: GetHintDto) {
		// Pick a sample cue to work with
		const sampleCue = getHintDto.cues[Math.floor(Math.random() * getHintDto.cues.length)]

		// Get list of triads containing the sample cue with limit to prevent memory issues
		const triadsContainingSampleCue = await this.prismaService.triad.findMany({
			where: { cues: { has: sampleCue.toUpperCase() } },
			take: 1000, // Reasonable limit to prevent memory issues
		})

		// Find a triad which contains the sample cue word and two other cues from the list of cues received
		const matchedTriad = triadsContainingSampleCue.find((triad) => triad.cues.every((cue) => getHintDto.cues.includes(cue)))

		return {
			hint: matchedTriad ? matchedTriad.cues : null,
			with: getHintDto.with,
			withValue:
				getHintDto.with && matchedTriad
					? getHintDto.with === 'KEYWORD_LENGTH'
						? matchedTriad.keyword.length
						: matchedTriad.keyword.charAt(0)
					: undefined,
		}
	}

	async getFourthTriadCues(getFourthTriadDto: GetFourthTriadDto) {
		const triadGroup = await this.prismaService.triadGroup.findFirst({
			where: {
				AND: {
					triad1Id: {
						in: getFourthTriadDto.triadsIds,
					},
					triad2Id: {
						in: getFourthTriadDto.triadsIds,
					},
					triad3Id: {
						in: getFourthTriadDto.triadsIds,
					},
				},
			},
			select: {
				Triad4: {
					select: {
						cues: true,
					},
				},
			},
		})

		return triadGroup?.Triad4?.cues
	}
}
