import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'

import { ImportController } from './import.controller'
import { ImportService } from './import.service'

@Module({
	imports: [
		MulterModule.register({
			limits: {
				fileSize: 10 * 1024 * 1024, // 10MB limit
			},
		}),
	],
	controllers: [ImportController],
	providers: [ImportService],
})
export class ImportModule {}
