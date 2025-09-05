import { Test, TestingModule } from '@nestjs/testing'

import { TriadsService } from './triads.service'

describe('TriadsService', () => {
	let service: TriadsService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [TriadsService],
		}).compile()

		service = module.get<TriadsService>(TriadsService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})
})
