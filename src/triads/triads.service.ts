import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { isEmpty, xor } from 'lodash'

import { PrismaService } from '../prisma/prisma.service'
import { CreateTriadGroupDto } from './dto/create-triad-group.dto'
import { DifficultyFilter, GetCuesDto } from './dto/get-cues.dto'
import { GetFourthTriadDto } from './dto/get-fourth-triad.dto'
import { GetHintDto } from './dto/get-hint.dto'
import { TriadInputDto } from './dto/triad-input.dto'
import { UpdateTriadGroupDto } from './dto/update-triad-group.dto'

@Injectable()
export class TriadsService {
	constructor(private readonly prismaService: PrismaService) {}

	async getCues(getCuesDto?: GetCuesDto) {
		// Determine if we should filter by difficulty
		const difficulty = getCuesDto?.difficulty || DifficultyFilter.RANDOM
		const shouldFilterByDifficulty = difficulty !== DifficultyFilter.RANDOM

		// Optimized query using JOINs instead of nested subqueries for better performance
		// Use parameterized query to prevent SQL injection
		let triadGroups: { id: number; triad1: string[]; triad2: string[]; triad3: string[] }[]

		if (shouldFilterByDifficulty) {
			// Use Prisma.sql for safe parameterization
			triadGroups = await this.prismaService.$queryRaw<{ id: number; triad1: string[]; triad2: string[]; triad3: string[] }[]>(
				Prisma.sql`
					SELECT 
						tg.id,
						t1.cues as triad1,
						t2.cues as triad2,
						t3.cues as triad3
					FROM "triadGroups" tg
					INNER JOIN "triads" t1 ON t1.id = tg."triad1Id"
					INNER JOIN "triads" t2 ON t2.id = tg."triad2Id"
					INNER JOIN "triads" t3 ON t3.id = tg."triad3Id"
					WHERE tg.active = true AND tg.difficulty = ${difficulty}::"Difficulty" AND tg.id = 222
					ORDER BY random()
					LIMIT 1;
				`,
			)
		} else {
			triadGroups = await this.prismaService.$queryRawUnsafe<{ id: number; triad1: string[]; triad2: string[]; triad3: string[] }[]>(`
				SELECT 
					tg.id,
					t1.cues as triad1,
					t2.cues as triad2,
					t3.cues as triad3
				FROM "triadGroups" tg
				INNER JOIN "triads" t1 ON t1.id = tg."triad1Id"
				INNER JOIN "triads" t2 ON t2.id = tg."triad2Id"
				INNER JOIN "triads" t3 ON t3.id = tg."triad3Id"
				WHERE tg.active = true AND tg.id = 222
				ORDER BY random()
				LIMIT 1;
			`)
		}

		if (!triadGroups || triadGroups.length === 0) {
			const difficultyMessage = shouldFilterByDifficulty ? ` with difficulty ${difficulty}` : ''
			return {
				triadGroupId: null,
				cues: null,
				message: `No active triad groups found${difficultyMessage}`,
			}
		}

		const triadGroup = triadGroups[0]
		if (!triadGroup.triad1 || !triadGroup.triad2 || !triadGroup.triad3) {
			throw new Error('Invalid triad group data')
		}

		return { triadGroupId: triadGroup.id, cues: [...triadGroup.triad1, ...triadGroup.triad2, ...triadGroup.triad3].sort(() => Math.random() - 0.5) }
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
				id: getFourthTriadDto.triadGroupId,
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

	async getTriadsByGroupId(id: number) {
		const triadGroup = await this.prismaService.triadGroup.findUnique({
			where: { id },
			select: {
				Triad1: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad2: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad3: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
			},
		})

		if (!triadGroup) {
			throw new NotFoundException(`Triad group with ID ${id} not found`)
		}

		// Return triads 1-3 as an array (skipping the fourth triad)
		return [triadGroup.Triad1, triadGroup.Triad2, triadGroup.Triad3]
	}

	async getTriadGroups(offset: number, limit: number, search?: string) {
		// Build where clause for search if provided
		// Search matches any of the 4 triads' keywords (case-insensitive partial match)
		// Note: This endpoint returns all groups including deactivated ones for frontend management
		const whereClause: Prisma.TriadGroupWhereInput = {}

		if (search) {
			whereClause.OR = [
				{ Triad1: { keyword: { contains: search, mode: 'insensitive' } } },
				{ Triad2: { keyword: { contains: search, mode: 'insensitive' } } },
				{ Triad3: { keyword: { contains: search, mode: 'insensitive' } } },
				{ Triad4: { keyword: { contains: search, mode: 'insensitive' } } },
			]
		}

		// Optimized query using select to only fetch needed fields
		// Single query with includes to avoid N+1 queries
		const triadGroups = await this.prismaService.triadGroup.findMany({
			where: whereClause,
			skip: offset,
			take: limit,
			select: {
				id: true,
				active: true,
				difficulty: true,
				Triad1: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad2: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad3: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad4: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
			},
		})

		// Transform the response to match the expected format (triad1, triad2, triad3, triad4)
		return triadGroups.map((group) => ({
			id: group.id,
			active: group.active,
			difficulty: group.difficulty,
			triad1: group.Triad1,
			triad2: group.Triad2,
			triad3: group.Triad3,
			triad4: group.Triad4,
		}))
	}

	async deleteTriadGroup(id: number) {
		// Find the triad group
		const triadGroup = await this.prismaService.triadGroup.findUnique({
			where: { id },
			select: {
				triad1Id: true,
				triad2Id: true,
				triad3Id: true,
				triad4Id: true,
			},
		})

		if (!triadGroup) {
			throw new NotFoundException(`Triad group with ID ${id} not found`)
		}

		const triadIds = [triadGroup.triad1Id, triadGroup.triad2Id, triadGroup.triad3Id, triadGroup.triad4Id]

		// Check if each triad is used by other groups
		const triadsToDelete: number[] = []
		for (const triadId of triadIds) {
			const usageCount = await this.prismaService.triadGroup.count({
				where: {
					OR: [{ triad1Id: triadId }, { triad2Id: triadId }, { triad3Id: triadId }, { triad4Id: triadId }],
				},
			})

			// Only delete if this is the only group using the triad
			if (usageCount === 1) {
				triadsToDelete.push(triadId)
			}
		}

		// Delete the triad group FIRST to avoid foreign key constraint violations
		await this.prismaService.triadGroup.delete({
			where: { id },
		})

		// Delete triads that are exclusively used by this group (now safe since group is deleted)
		if (triadsToDelete.length > 0) {
			await this.prismaService.triad.deleteMany({
				where: {
					id: {
						in: triadsToDelete,
					},
				},
			})
		}

		return { success: true, message: `Triad group ${id} deleted successfully` }
	}

	async updateTriadGroupActive(id: number, active: boolean) {
		const triadGroup = await this.prismaService.triadGroup.findUnique({
			where: { id },
		})

		if (!triadGroup) {
			throw new NotFoundException(`Triad group with ID ${id} not found`)
		}

		const updated = await this.prismaService.triadGroup.update({
			where: { id },
			data: { active },
			select: {
				id: true,
				active: true,
			},
		})

		return updated
	}

	async createTriadGroup(createDto: CreateTriadGroupDto) {
		// Validate each triad
		this.validateKeywordSubstring(createDto.triad1)
		this.validateKeywordSubstring(createDto.triad2)
		this.validateKeywordSubstring(createDto.triad3)
		this.validateKeywordSubstring(createDto.triad4)

		// Validate fourth triad cues
		this.validateFourthTriadCues(createDto.triad1, createDto.triad2, createDto.triad3, createDto.triad4)

		// Helper function to extract cues from fullPhrases by removing the keyword (case-insensitive)
		// Example: keyword="STOCK", fullPhrases=["OVERSTOCK","STOCK EXCHANGE","WOODSTOCK"]
		// Result: cues=["OVER","EXCHANGE","WOOD"]
		const extractCues = (fullPhrases: string[], keyword: string): string[] => {
			const keywordUpper = keyword.toUpperCase()
			return fullPhrases.map((phrase) => {
				const phraseUpper = phrase.toUpperCase()
				let cue = phrase
				// Check if phrase ends with keyword (e.g., "OVERSTOCK" → "OVER" or "12-STEP" → "12")
				if (phraseUpper.endsWith(keywordUpper)) {
					// Check if there's a separator (hyphen, space, etc.) before the keyword
					const beforeKeyword = phrase.slice(0, -keyword.length)
					const lastChar = beforeKeyword.slice(-1)
					// If the last character before keyword is a separator, remove it too
					if (lastChar === '-' || lastChar === ' ' || lastChar === '_') {
						cue = beforeKeyword.slice(0, -1).trim()
					} else {
						cue = beforeKeyword.trim()
					}
				}
				// Check if phrase starts with keyword followed by space (e.g., "STOCK EXCHANGE" → "EXCHANGE")
				else if (phraseUpper.startsWith(keywordUpper + ' ')) {
					cue = phrase.slice(keyword.length + 1).trim()
				}
				// Check if phrase starts with keyword (e.g., "STOCKEXCHANGE" → "EXCHANGE")
				else if (phraseUpper.startsWith(keywordUpper)) {
					cue = phrase.slice(keyword.length).trim()
				}
				// Keyword is in the middle or elsewhere, replace it (case-insensitive)
				else if (phraseUpper.includes(keywordUpper)) {
					const index = phraseUpper.indexOf(keywordUpper)
					cue = (phrase.slice(0, index) + phrase.slice(index + keyword.length)).trim()
				}
				// Convert to uppercase before returning
				return cue.toUpperCase()
			})
		}

		// Create all 4 triads
		const triad1 = await this.prismaService.triad.create({
			data: {
				keyword: createDto.triad1.keyword,
				cues: extractCues(createDto.triad1.fullPhrases, createDto.triad1.keyword),
				fullPhrases: createDto.triad1.fullPhrases,
			},
		})

		const triad2 = await this.prismaService.triad.create({
			data: {
				keyword: createDto.triad2.keyword,
				cues: extractCues(createDto.triad2.fullPhrases, createDto.triad2.keyword),
				fullPhrases: createDto.triad2.fullPhrases,
			},
		})

		const triad3 = await this.prismaService.triad.create({
			data: {
				keyword: createDto.triad3.keyword,
				cues: extractCues(createDto.triad3.fullPhrases, createDto.triad3.keyword),
				fullPhrases: createDto.triad3.fullPhrases,
			},
		})

		const triad4 = await this.prismaService.triad.create({
			data: {
				keyword: createDto.triad4.keyword,
				cues: extractCues(createDto.triad4.fullPhrases, createDto.triad4.keyword),
				fullPhrases: createDto.triad4.fullPhrases,
			},
		})

		// Create the triad group
		const triadGroup = await this.prismaService.triadGroup.create({
			data: {
				triad1Id: triad1.id,
				triad2Id: triad2.id,
				triad3Id: triad3.id,
				triad4Id: triad4.id,
				active: true,
				difficulty: createDto.difficulty,
			},
			select: {
				id: true,
				active: true,
				difficulty: true,
				Triad1: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad2: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad3: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad4: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
			},
		})

		// Transform the response
		return {
			id: triadGroup.id,
			active: triadGroup.active,
			difficulty: triadGroup.difficulty,
			triad1: triadGroup.Triad1,
			triad2: triadGroup.Triad2,
			triad3: triadGroup.Triad3,
			triad4: triadGroup.Triad4,
		}
	}

	async updateTriadGroup(updateDto: UpdateTriadGroupDto) {
		// Validate each triad
		this.validateKeywordSubstring(updateDto.triad1)
		this.validateKeywordSubstring(updateDto.triad2)
		this.validateKeywordSubstring(updateDto.triad3)
		this.validateKeywordSubstring(updateDto.triad4)

		// Validate fourth triad cues
		this.validateFourthTriadCues(updateDto.triad1, updateDto.triad2, updateDto.triad3, updateDto.triad4)

		// Find the triad group
		const triadGroup = await this.prismaService.triadGroup.findUnique({
			where: { id: updateDto.id },
			select: {
				triad1Id: true,
				triad2Id: true,
				triad3Id: true,
				triad4Id: true,
			},
		})

		if (!triadGroup) {
			throw new NotFoundException(`Triad group with ID ${updateDto.id} not found`)
		}

		// Helper function to extract cues from fullPhrases by removing the keyword (case-insensitive)
		// Example: keyword="STOCK", fullPhrases=["OVERSTOCK","STOCK EXCHANGE","WOODSTOCK"]
		// Result: cues=["OVER","EXCHANGE","WOOD"]
		const extractCues = (fullPhrases: string[], keyword: string): string[] => {
			const keywordUpper = keyword.toUpperCase()
			return fullPhrases.map((phrase) => {
				const phraseUpper = phrase.toUpperCase()
				let cue = phrase
				// Check if phrase ends with keyword (e.g., "OVERSTOCK" → "OVER" or "12-STEP" → "12")
				if (phraseUpper.endsWith(keywordUpper)) {
					// Check if there's a separator (hyphen, space, etc.) before the keyword
					const beforeKeyword = phrase.slice(0, -keyword.length)
					const lastChar = beforeKeyword.slice(-1)
					// If the last character before keyword is a separator, remove it too
					if (lastChar === '-' || lastChar === ' ' || lastChar === '_') {
						cue = beforeKeyword.slice(0, -1).trim()
					} else {
						cue = beforeKeyword.trim()
					}
				}
				// Check if phrase starts with keyword followed by space (e.g., "STOCK EXCHANGE" → "EXCHANGE")
				else if (phraseUpper.startsWith(keywordUpper + ' ')) {
					cue = phrase.slice(keyword.length + 1).trim()
				}
				// Check if phrase starts with keyword (e.g., "STOCKEXCHANGE" → "EXCHANGE")
				else if (phraseUpper.startsWith(keywordUpper)) {
					cue = phrase.slice(keyword.length).trim()
				}
				// Keyword is in the middle or elsewhere, replace it (case-insensitive)
				else if (phraseUpper.includes(keywordUpper)) {
					const index = phraseUpper.indexOf(keywordUpper)
					cue = (phrase.slice(0, index) + phrase.slice(index + keyword.length)).trim()
				}
				// Convert to uppercase before returning
				return cue.toUpperCase()
			})
		}

		// Update all 4 triads
		await this.prismaService.triad.update({
			where: { id: triadGroup.triad1Id },
			data: {
				keyword: updateDto.triad1.keyword,
				cues: extractCues(updateDto.triad1.fullPhrases, updateDto.triad1.keyword),
				fullPhrases: updateDto.triad1.fullPhrases,
			},
		})

		await this.prismaService.triad.update({
			where: { id: triadGroup.triad2Id },
			data: {
				keyword: updateDto.triad2.keyword,
				cues: extractCues(updateDto.triad2.fullPhrases, updateDto.triad2.keyword),
				fullPhrases: updateDto.triad2.fullPhrases,
			},
		})

		await this.prismaService.triad.update({
			where: { id: triadGroup.triad3Id },
			data: {
				keyword: updateDto.triad3.keyword,
				cues: extractCues(updateDto.triad3.fullPhrases, updateDto.triad3.keyword),
				fullPhrases: updateDto.triad3.fullPhrases,
			},
		})

		await this.prismaService.triad.update({
			where: { id: triadGroup.triad4Id },
			data: {
				keyword: updateDto.triad4.keyword,
				cues: extractCues(updateDto.triad4.fullPhrases, updateDto.triad4.keyword),
				fullPhrases: updateDto.triad4.fullPhrases,
			},
		})

		// Update the triad group difficulty
		await this.prismaService.triadGroup.update({
			where: { id: updateDto.id },
			data: {
				difficulty: updateDto.difficulty,
			},
		})

		// Fetch and return the updated triad group
		const updated = await this.prismaService.triadGroup.findUnique({
			where: { id: updateDto.id },
			select: {
				id: true,
				active: true,
				difficulty: true,
				Triad1: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad2: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad3: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
				Triad4: {
					select: {
						id: true,
						keyword: true,
						cues: true,
						fullPhrases: true,
					},
				},
			},
		})

		// Transform the response
		return {
			id: updated.id,
			active: updated.active,
			difficulty: updated.difficulty,
			triad1: updated.Triad1,
			triad2: updated.Triad2,
			triad3: updated.Triad3,
			triad4: updated.Triad4,
		}
	}

	// Validation helper: Check if keyword is substring of each fullPhrase (case-insensitive)
	private validateKeywordSubstring(triad: TriadInputDto): void {
		if (!triad.fullPhrases || triad.fullPhrases.length === 0) {
			throw new BadRequestException('Triad must have fullPhrases')
		}
		if (!triad.keyword) {
			throw new BadRequestException('Triad must have a keyword')
		}

		// Convert to uppercase for case-insensitive comparison
		const keywordUpper = triad.keyword.toUpperCase()
		const invalidPhrases = triad.fullPhrases.filter((phrase) => !phrase.toUpperCase().includes(keywordUpper))
		if (invalidPhrases.length > 0) {
			throw new BadRequestException(
				`Keyword "${triad.keyword}" must be a substring of each fullPhrase. Invalid fullPhrases: ${invalidPhrases.join(', ')}`,
			)
		}
	}

	// Validation helper: Check if keywords of first 3 triads match cues extracted from fullPhrases of 4th triad (case-insensitive)
	private validateFourthTriadCues(triad1: TriadInputDto, triad2: TriadInputDto, triad3: TriadInputDto, triad4: TriadInputDto): void {
		// Convert to uppercase for case-insensitive comparison
		const expectedCues = [triad1.keyword.toUpperCase(), triad2.keyword.toUpperCase(), triad3.keyword.toUpperCase()].sort()

		// Extract cues from fullPhrases by removing the keyword from each phrase (case-insensitive)
		const extractCues = (fullPhrases: string[], keyword: string): string[] => {
			const keywordUpper = keyword.toUpperCase()
			return fullPhrases.map((phrase) => {
				const phraseUpper = phrase.toUpperCase()
				// Try to remove from the end first (most common case: "CUE KEYWORD" or "CUE-KEYWORD")
				let cue = phrase
				if (phraseUpper.endsWith(keywordUpper)) {
					// Check if there's a separator (hyphen, space, etc.) before the keyword
					const beforeKeyword = phrase.slice(0, -keyword.length)
					const lastChar = beforeKeyword.slice(-1)
					// If the last character before keyword is a separator, remove it too
					if (lastChar === '-' || lastChar === ' ' || lastChar === '_') {
						cue = beforeKeyword.slice(0, -1).trim()
					} else {
						cue = beforeKeyword.trim()
					}
				} else if (phraseUpper.startsWith(keywordUpper + ' ')) {
					// Check if phrase starts with keyword followed by space (e.g., "STOCK EXCHANGE" → "EXCHANGE")
					cue = phrase.slice(keyword.length + 1).trim()
				} else if (phraseUpper.startsWith(keywordUpper)) {
					// If keyword is at the start: "KEYWORD CUE"
					cue = phrase.slice(keyword.length).trim()
				} else if (phraseUpper.includes(keywordUpper)) {
					// Keyword is in the middle, replace it (case-insensitive)
					// Find the position and remove the actual keyword from original phrase
					const index = phraseUpper.indexOf(keywordUpper)
					cue = (phrase.slice(0, index) + phrase.slice(index + keyword.length)).trim()
				}
				return cue.toUpperCase()
			})
		}

		const actualCues = extractCues(triad4.fullPhrases, triad4.keyword).sort()

		if (expectedCues.length !== actualCues.length) {
			throw new BadRequestException('Keywords of triad1, triad2, and triad3 must match the cues extracted from fullPhrases of triad4')
		}

		const mismatch = expectedCues.some((keyword, index) => !actualCues[index].includes(keyword))
		if (mismatch) {
			throw new BadRequestException(
				`Keywords of triad1 (${triad1.keyword}), triad2 (${triad2.keyword}), and triad3 (${triad3.keyword}) must match the cues extracted from fullPhrases of triad4 (${triad4.fullPhrases.join(', ')})`,
			)
		}
	}
}
