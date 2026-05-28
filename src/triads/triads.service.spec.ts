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
})
