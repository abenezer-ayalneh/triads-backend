import { Module } from '@nestjs/common'

import { TriadsController } from './triads.controller'
import { TriadsService } from './triads.service'
import { TriadsDailyController } from './triads-daily.controller'
import { TriadsDailyService } from './triads-daily.service'

@Module({
	controllers: [TriadsController, TriadsDailyController],
	providers: [TriadsService, TriadsDailyService],
})
export class TriadsModule {}
