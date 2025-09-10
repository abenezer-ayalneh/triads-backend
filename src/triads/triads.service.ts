import { Injectable } from '@nestjs/common'
import * as _ from 'lodash'

import { PrismaService } from '../prisma/prisma.service'
import { GetFourthTriadDto } from './dto/get-fourth-triad.dto'
import { GetHintDto } from './dto/get-hint.dto'

@Injectable()
export class TriadsService {
	constructor(private readonly prismaService: PrismaService) {}

	async getCues() {
		const randomTriadCues = await this.prismaService.$queryRawUnsafe<{ id: number; triad1: string[]; triad2: string[]; triad3: string[] }[]>(`
			SELECT id,
				   (SELECT cues FROM triads WHERE id = "triadGroups"."triad1Id") as triad1,
				   (SELECT cues FROM triads WHERE id = "triadGroups"."triad2Id") as triad2,
				   (SELECT cues FROM triads WHERE id = "triadGroups"."triad3Id") as triad3
			FROM "triadGroups"
			ORDER BY random()
			LIMIT 1;
		`)

		const randomTriadCue = randomTriadCues[0]
		return [...randomTriadCue.triad1, ...randomTriadCue.triad2, ...randomTriadCue.triad3].sort(() => Math.random() - 0.5)
	}

	async getMatchedTriad(cues: string[]): Promise<{ id: number; keyword: string; cues: string[]; fullPhrases: string[] } | undefined> {
		const sampleCue = cues[0]

		const triadsContainingSampleCue = await this.prismaService.triad.findMany({ where: { cues: { has: sampleCue.toUpperCase() } } })

		return triadsContainingSampleCue.find((triad) =>
			_.isEmpty(
				_.xor(
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

		// Get list of triads containing the sample cue
		const triadsContainingSampleCue = await this.prismaService.triad.findMany({ where: { cues: { has: sampleCue.toUpperCase() } } })

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
