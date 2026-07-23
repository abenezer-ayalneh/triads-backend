import { PublicTriadGroupsController } from './public-triad-groups.controller'
import { TriadsService } from './triads.service'

describe('PublicTriadGroupsController', () => {
	it('delegates the public export request to TriadsService', async () => {
		const groups = [{ id: 1, difficulty: 'EASY', triads: [] }]
		const getPublicTriadGroups = jest.fn().mockResolvedValue(groups)
		const triadsService = {
			getPublicTriadGroups,
		} as unknown as TriadsService
		const controller = new PublicTriadGroupsController(triadsService)

		await expect(controller.getPublicTriadGroups()).resolves.toEqual(groups)
		expect(getPublicTriadGroups).toHaveBeenCalledTimes(1)
	})
})
