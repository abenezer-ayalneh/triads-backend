import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'
import { TriadsService } from './triads.service'
import { TriadsDailyService } from './triads-daily.service'

describe('TriadsService', () => {
	let service: TriadsService
	let prismaService: {
		$queryRaw: jest.Mock
		triadGroup: {
			findMany: jest.Mock
			groupBy: jest.Mock
		}
	}

	beforeEach(async () => {
		prismaService = {
			$queryRaw: jest.fn(),
			triadGroup: {
				findMany: jest.fn(),
				groupBy: jest.fn(),
			},
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TriadsService,
				{ provide: PrismaService, useValue: prismaService },
				{
					provide: TriadsDailyService,
					useValue: {
						incrementClassicExtraStart: jest.fn().mockResolvedValue({
							classicExtrasUsed: 1,
							classicExtrasRemaining: 2,
							classicExtrasLimit: 3,
							canPlayClassic: true,
							classicBlockedReason: null,
						}),
					},
				},
			],
		}).compile()

		service = module.get<TriadsService>(TriadsService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('checkAnswer', () => {
		const triad = { id: 1, keyword: 'fish', cues: ['scales', 'fin', 'gill'], fullPhrases: [] }

		it('accepts the exact correct answer', () => {
			expect(service.checkAnswer('fish', triad)).toEqual(triad)
		})

		it('accepts an answer with a trailing space (iOS auto-complete bug)', () => {
			expect(service.checkAnswer('fish ', triad)).toEqual(triad)
		})

		it('accepts an answer with leading whitespace', () => {
			expect(service.checkAnswer(' fish', triad)).toEqual(triad)
		})

		it('rejects a different answer', () => {
			expect(service.checkAnswer('cat', triad)).toBe(false)
		})
	})

	describe('getTriadGroups', () => {
		const group = (id: number, keyword: string, difficulty = 'EASY') => ({
			id,
			active: true,
			difficulty,
			Triad1: { id: id * 10 + 1, keyword, cues: [`${keyword} cue 1`], fullPhrases: [] },
			Triad2: { id: id * 10 + 2, keyword: `${keyword} 2`, cues: [`${keyword} cue 2`], fullPhrases: [] },
			Triad3: { id: id * 10 + 3, keyword: `${keyword} 3`, cues: [`${keyword} cue 3`], fullPhrases: [] },
			Triad4: { id: id * 10 + 4, keyword: `${keyword} 4`, cues: [`${keyword} cue 4`], fullPhrases: [] },
		})

		it('returns scheduled groups before newly created unscheduled groups', async () => {
			const scheduledMarch = group(2, 'march')
			const scheduledMay = group(5, 'may')
			const unscheduledOld = group(1, 'old')
			const unscheduledNew = group(99, 'new')

			prismaService.$queryRaw.mockResolvedValue([{ id: 2 }, { id: 5 }, { id: 1 }, { id: 99 }])
			prismaService.triadGroup.findMany.mockResolvedValue([unscheduledNew, scheduledMay, unscheduledOld, scheduledMarch])

			const result = await service.getTriadGroups(0, 20)

			expect(result.map((g) => g.id)).toEqual([2, 5, 1, 99])
			expect(prismaService.triadGroup.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: { in: [2, 5, 1, 99] } },
				}),
			)
		})

		it('sorts unscheduled groups by difficulty from easy to hard in the raw query', async () => {
			prismaService.$queryRaw.mockResolvedValue([])

			await service.getTriadGroups(0, 20)

			const firstCall = prismaService.$queryRaw.mock.calls[0] as [TemplateStringsArray]
			const sql = firstCall[0].join('')
			expect(sql).toContain('CASE g.difficulty::text')
			expect(sql).toContain("WHEN 'EASY' THEN 0")
			expect(sql).toContain("WHEN 'MEDIUM' THEN 1")
			expect(sql).toContain("WHEN 'HARD' THEN 2")
			expect(sql).toContain('g.id ASC')
		})

		it('preserves the raw-query easy-to-hard order when hydrating unscheduled groups', async () => {
			const scheduled = group(2, 'scheduled', 'HARD')
			const easy = group(8, 'easy', 'EASY')
			const medium = group(3, 'medium', 'MEDIUM')
			const hard = group(1, 'hard', 'HARD')

			prismaService.$queryRaw.mockResolvedValue([{ id: 2 }, { id: 8 }, { id: 3 }, { id: 1 }])
			prismaService.triadGroup.findMany.mockResolvedValue([hard, medium, scheduled, easy])

			const result = await service.getTriadGroups(0, 20)

			expect(result.map((g) => g.id)).toEqual([2, 8, 3, 1])
		})

		it('preserves assigned-puzzle-date order when the raw query orders scheduled groups', async () => {
			const scheduledEarliest = group(7, 'early')
			const scheduledLater = group(3, 'later')
			const unscheduled = group(20, 'unscheduled')

			prismaService.$queryRaw.mockResolvedValue([{ id: 7 }, { id: 3 }, { id: 20 }])
			prismaService.triadGroup.findMany.mockResolvedValue([unscheduled, scheduledLater, scheduledEarliest])

			const result = await service.getTriadGroups(0, 20)

			expect(result.map((g) => g.id)).toEqual([7, 3, 20])
		})

		it('keeps scheduled-first ordering within search results', async () => {
			const scheduled = group(4, 'apple')
			const unscheduled = group(12, 'apple tart')

			prismaService.$queryRaw.mockResolvedValue([{ id: 4 }, { id: 12 }])
			prismaService.triadGroup.findMany.mockResolvedValue([unscheduled, scheduled])

			const result = await service.getTriadGroups(0, 20, 'apple')

			expect(result.map((g) => g.id)).toEqual([4, 12])
			expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1)
		})
	})

	describe('getTriadGroupStats', () => {
		it('counts only active groups by difficulty', async () => {
			prismaService.triadGroup.groupBy.mockResolvedValue([
				{ difficulty: 'EASY', _count: { _all: 2 } },
				{ difficulty: 'MEDIUM', _count: { _all: 1 } },
				{ difficulty: 'HARD', _count: { _all: 3 } },
			])

			const result = await service.getTriadGroupStats()

			expect(prismaService.triadGroup.groupBy).toHaveBeenCalledWith({
				by: ['difficulty'],
				where: { active: true },
				_count: { _all: true },
			})
			expect(result).toEqual({
				totalActive: 6,
				byDifficulty: {
					EASY: 2,
					MEDIUM: 1,
					HARD: 3,
				},
			})
		})

		it('returns zero counts for difficulties with no active groups', async () => {
			prismaService.triadGroup.groupBy.mockResolvedValue([{ difficulty: 'EASY', _count: { _all: 4 } }])

			const result = await service.getTriadGroupStats()

			expect(result).toEqual({
				totalActive: 4,
				byDifficulty: {
					EASY: 4,
					MEDIUM: 0,
					HARD: 0,
				},
			})
		})
	})
})
