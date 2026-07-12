import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'
import { TriadsController } from './triads.controller'
import { TriadsService } from './triads.service'
import { TriadsDailyService } from './triads-daily.service'

describe('TriadsController', () => {
	let controller: TriadsController

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TriadsController],
			providers: [TriadsService, { provide: PrismaService, useValue: {} }, { provide: TriadsDailyService, useValue: {} }],
		}).compile()

		controller = module.get<TriadsController>(TriadsController)
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})
})
