import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'
import { TriadsService } from './triads.service'
import { TriadsDailyService } from './triads-daily.service'

describe('TriadsService', () => {
	let service: TriadsService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TriadsService,
				{ provide: PrismaService, useValue: {} },
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
})
