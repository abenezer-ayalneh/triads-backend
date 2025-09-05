import { Module } from '@nestjs/common'

import { TriadsController } from './triads.controller'
import { TriadsService } from './triads.service'

@Module({
	controllers: [TriadsController],
	providers: [TriadsService],
})
export class TriadsModule {}
