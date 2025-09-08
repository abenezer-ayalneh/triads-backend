import { Injectable } from '@nestjs/common'
import _ from 'lodash'

import { PrismaService } from '../prisma/prisma.service'
import { GetFourthTriadDto } from './dto/get-fourth-triad.dto'
import { GetHintDto } from './dto/get-hint.dto'

@Injectable()
export class TriadsService {
	constructor(private readonly prismaService: PrismaService) {}

	async getCues() {
		// TODO: randomly select a triad group
		const triadGroup = await this.prismaService.triadGroup.findFirst({
			select: {
				id: true,
				Triad1: {
					select: {
						id: true,
						cues: true,
					},
				},
				Triad2: {
					select: {
						id: true,
						cues: true,
					},
				},
				Triad3: {
					select: {
						id: true,
						cues: true,
					},
				},
			},
		})

		return [...triadGroup.Triad1.cues, ...triadGroup.Triad2.cues, ...triadGroup.Triad3.cues].sort(() => Math.random() - 0.5)
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
		const matchedTriad = triadsContainingSampleCue.find((triad) => _.intersection(triad.cues, getHintDto.cues))

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
