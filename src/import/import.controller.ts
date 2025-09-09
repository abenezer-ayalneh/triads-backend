import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Express } from 'express'

import { ImportService } from './import.service'

@Controller('import')
export class ImportController {
	constructor(private readonly importService: ImportService) {}

	@Post('triads')
	@UseInterceptors(FileInterceptor('file'))
	async importTriads(@UploadedFile() file: Express.Multer.File) {
		return this.importService.importTriadsFromExcel(file)
	}
}
