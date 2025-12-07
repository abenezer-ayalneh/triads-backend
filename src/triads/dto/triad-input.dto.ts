import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator'

import { ToUpperCase } from '../../shared/decorators/to-uppercase.decorator'

export class TriadInputDto {
	@IsString()
	@ToUpperCase()
	keyword: string

	@IsArray()
	@ArrayMinSize(3)
	@ArrayMaxSize(3)
	@IsString({ each: true })
	@ToUpperCase()
	cues: string[]
}
