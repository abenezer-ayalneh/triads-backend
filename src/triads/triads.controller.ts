import { Controller, Get, Query } from '@nestjs/common'

import { CheckAnswerDto } from './dto/check-answer.dto'
import { CheckSolutionDto } from './dto/check-solution.dto'
import { GetFourthTriadDto } from './dto/get-fourth-triad.dto'
import { GetHintDto } from './dto/get-hint.dto'
import { TriadsService } from './triads.service'

@Controller('triads')
export class TriadsController {
	constructor(private readonly triadsService: TriadsService) {}

	@Get('cues')
	getCues() {
		return this.triadsService.getCues()
	}

	@Get('hint')
	getHint(@Query() getHintDto: GetHintDto) {
		return this.triadsService.getHint(getHintDto)
	}

	@Get('check-triad')
	async checkSolution(@Query() checkSolutionDto: CheckSolutionDto) {
		const matchedTriad = await this.triadsService.getMatchedTriad(checkSolutionDto.cues)

		return Boolean(matchedTriad)
	}

	@Get('keyword-length-hint')
	async getKeywordLengthHint(@Query() checkSolutionDto: CheckSolutionDto) {
		const matchedTriad = await this.triadsService.getMatchedTriad(checkSolutionDto.cues)

		return matchedTriad ? matchedTriad.keyword.length : null
	}

	@Get('first-letter-hint')
	async getFirstLetterHint(@Query() checkSolutionDto: CheckSolutionDto) {
		const matchedTriad = await this.triadsService.getMatchedTriad(checkSolutionDto.cues)

		return matchedTriad ? matchedTriad.keyword.charAt(0)?.toUpperCase() : null
	}

	@Get('check-answer')
	async checkAnswer(@Query() checkAnswerDto: CheckAnswerDto) {
		const matchedTriad = await this.triadsService.getMatchedTriad(checkAnswerDto.cues)

		return this.triadsService.checkAnswer(checkAnswerDto.answer, matchedTriad)
	}

	@Get('fourth-triad-cues')
	getFourthTriadCues(@Query() getFourthTriadDto: GetFourthTriadDto) {
		return this.triadsService.getFourthTriadCues(getFourthTriadDto)
	}
}
