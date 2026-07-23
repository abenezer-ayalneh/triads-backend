import { Controller, Get } from '@nestjs/common'

import { TriadsService } from './triads.service'

@Controller('public/triad-groups')
export class PublicTriadGroupsController {
	constructor(private readonly triadsService: TriadsService) {}

	@Get()
	getPublicTriadGroups() {
		return this.triadsService.getPublicTriadGroups()
	}
}
