import { Module } from '@nestjs/common'

import { PublicTriadGroupsController } from './public-triad-groups.controller'
import { TriadsController } from './triads.controller'
import { TriadsService } from './triads.service'
import { TriadsDailyController } from './triads-daily.controller'
import { TriadsDailyService } from './triads-daily.service'

@Module({
	controllers: [TriadsController, TriadsDailyController, PublicTriadGroupsController],
	providers: [TriadsService, TriadsDailyService],
})
export class TriadsModule {}
