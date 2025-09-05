import { Test, TestingModule } from '@nestjs/testing'

import { TriadsController } from './triads.controller'
import { TriadsService } from './triads.service'

describe('TriadsController', () => {
	let controller: TriadsController

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TriadsController],
			providers: [TriadsService],
		}).compile()

		controller = module.get<TriadsController>(TriadsController)
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})
})
