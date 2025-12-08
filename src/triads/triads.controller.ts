import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common'

import { CheckAnswerDto } from './dto/check-answer.dto'
import { CheckSolutionDto } from './dto/check-solution.dto'
import { CreateTriadGroupDto } from './dto/create-triad-group.dto'
import { GetFourthTriadDto } from './dto/get-fourth-triad.dto'
import { GetHintDto } from './dto/get-hint.dto'
import { GetTriadGroupsDto } from './dto/get-triad-groups.dto'
import { UpdateTriadGroupDto } from './dto/update-triad-group.dto'
import { UpdateTriadGroupActiveDto } from './dto/update-triad-group-active.dto'
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

	@Get('check-answer')
	async checkAnswer(@Query() checkAnswerDto: CheckAnswerDto) {
		const matchedTriad = await this.triadsService.getMatchedTriad(checkAnswerDto.cues)

		return this.triadsService.checkAnswer(checkAnswerDto.answer, matchedTriad)
	}

	@Get('fourth-triad-cues')
	getFourthTriadCues(@Query() getFourthTriadDto: GetFourthTriadDto) {
		return this.triadsService.getFourthTriadCues(getFourthTriadDto)
	}

	@Get('groups')
	async getTriadGroups(@Query() getTriadGroupsDto: GetTriadGroupsDto) {
		const offset = getTriadGroupsDto.offset ?? 0
		const limit = getTriadGroupsDto.limit ?? 20
		const search = getTriadGroupsDto.search
		return this.triadsService.getTriadGroups(offset, limit, search)
	}

	@Delete('groups/:id')
	async deleteTriadGroup(@Param('id', ParseIntPipe) id: number) {
		return this.triadsService.deleteTriadGroup(id)
	}

	@Patch('groups/:id/status')
	async updateTriadGroupActive(@Param('id', ParseIntPipe) id: number, @Body() updateDto: Omit<UpdateTriadGroupActiveDto, 'id'>) {
		return this.triadsService.updateTriadGroupActive(id, updateDto.active)
	}

	@Post('groups')
	async createTriadGroup(@Body() createDto: CreateTriadGroupDto) {
		return this.triadsService.createTriadGroup(createDto)
	}

	@Put('groups/:id')
	async updateTriadGroup(@Param('id', ParseIntPipe) id: number, @Body() updateDto: Omit<UpdateTriadGroupDto, 'id'>) {
		return this.triadsService.updateTriadGroup({ ...updateDto, id })
	}
}
