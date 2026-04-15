import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { DailyAttemptStatus, Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { easternYmdToDbDate, getEasternYmd, getNextEasternMidnightIso } from './triads-daily-timezone'

const ANONYMOUS_ID_PATTERN = /^[a-zA-Z0-9-]{8,128}$/

@Injectable()
export class TriadsDailyService {
	constructor(private readonly prismaService: PrismaService) {}

	validateAnonymousId(anonymousId: string | undefined): asserts anonymousId is string {
		if (!anonymousId || !ANONYMOUS_ID_PATTERN.test(anonymousId)) {
			throw new BadRequestException('Header x-anonymous-id is required (8–128 alphanumeric or hyphen characters).')
		}
	}

	private shuffleInitialCues(triad1: string[], triad2: string[], triad3: string[]): string[] {
		return [...triad1, ...triad2, ...triad3].sort(() => Math.random() - 0.5)
	}

	async getDailyCues(anonymousId: string) {
		this.validateAnonymousId(anonymousId)

		const puzzleDateStr = getEasternYmd()
		const puzzleDate = easternYmdToDbDate(puzzleDateStr)
		const nextPuzzleAt = getNextEasternMidnightIso()

		const schedule = await this.prismaService.triadDailySchedule.findUnique({
			where: { puzzleDate },
			include: {
				TriadGroup: {
					include: {
						Triad1: { select: { cues: true } },
						Triad2: { select: { cues: true } },
						Triad3: { select: { cues: true } },
					},
				},
			},
		})

		if (!schedule) {
			return {
				scheduled: false as const,
				puzzleDate: puzzleDateStr,
				nextPuzzleAt,
				message: 'No puzzle scheduled for today.',
			}
		}

		const { TriadGroup: group } = schedule
		if (!group.active) {
			return {
				scheduled: false as const,
				puzzleDate: puzzleDateStr,
				nextPuzzleAt,
				message: 'Today’s puzzle is unavailable.',
			}
		}

		const triadGroupId = group.id

		const attempt = await this.prismaService.dailyTriadAttempt.findUnique({
			where: {
				anonymousId_puzzleDate: {
					anonymousId,
					puzzleDate,
				},
			},
		})

		if (attempt?.status === DailyAttemptStatus.WON || attempt?.status === DailyAttemptStatus.LOST) {
			return {
				scheduled: true as const,
				alreadyCompleted: true as const,
				attemptStatus: attempt.status,
				score: attempt.score,
				triadGroupId,
				puzzleDate: puzzleDateStr,
				nextPuzzleAt,
				cues: null,
			}
		}

		if (attempt?.status === DailyAttemptStatus.IN_PROGRESS) {
			return {
				scheduled: true as const,
				alreadyCompleted: false as const,
				attemptStatus: DailyAttemptStatus.IN_PROGRESS,
				triadGroupId,
				cues: attempt.scrambledCues,
				puzzleDate: puzzleDateStr,
				nextPuzzleAt,
			}
		}

		const t1 = group.Triad1?.cues
		const t2 = group.Triad2?.cues
		const t3 = group.Triad3?.cues
		if (!t1?.length || !t2?.length || !t3?.length) {
			throw new BadRequestException('Today’s puzzle data is invalid.')
		}

		const cues = this.shuffleInitialCues(t1, t2, t3)

		await this.prismaService.dailyTriadAttempt.create({
			data: {
				anonymousId,
				puzzleDate,
				triadGroupId,
				status: DailyAttemptStatus.IN_PROGRESS,
				scrambledCues: cues,
			},
		})

		return {
			scheduled: true as const,
			alreadyCompleted: false as const,
			attemptStatus: DailyAttemptStatus.IN_PROGRESS,
			triadGroupId,
			cues,
			puzzleDate: puzzleDateStr,
			nextPuzzleAt,
		}
	}

	async completeDaily(anonymousId: string, outcome: 'won' | 'lost', score: number) {
		this.validateAnonymousId(anonymousId)

		const puzzleDateStr = getEasternYmd()
		const puzzleDate = easternYmdToDbDate(puzzleDateStr)

		const attempt = await this.prismaService.dailyTriadAttempt.findUnique({
			where: {
				anonymousId_puzzleDate: {
					anonymousId,
					puzzleDate,
				},
			},
		})

		if (!attempt) {
			throw new NotFoundException('No daily game in progress for this player.')
		}

		if (attempt.status === DailyAttemptStatus.WON || attempt.status === DailyAttemptStatus.LOST) {
			throw new ConflictException('This daily puzzle is already completed.')
		}

		const nextStatus = outcome === 'won' ? DailyAttemptStatus.WON : DailyAttemptStatus.LOST

		await this.prismaService.dailyTriadAttempt.update({
			where: { id: attempt.id },
			data: {
				status: nextStatus,
				score,
			},
		})

		return {
			ok: true as const,
			puzzleDate: puzzleDateStr,
			nextPuzzleAt: getNextEasternMidnightIso(),
		}
	}

	async listSchedules(offset = 0, limit = 50) {
		const take = Math.min(limit, 100)
		const rows = await this.prismaService.triadDailySchedule.findMany({
			orderBy: { puzzleDate: 'desc' },
			skip: offset,
			take,
			select: {
				id: true,
				puzzleDate: true,
				triadGroupId: true,
			},
		})

		return rows.map((r) => ({
			id: r.id,
			puzzleDate: this.formatDbDateAsYmd(r.puzzleDate),
			triadGroupId: r.triadGroupId,
		}))
	}

	async createSchedule(puzzleDateYmd: string, triadGroupId: number) {
		const puzzleDate = easternYmdToDbDate(puzzleDateYmd)

		const group = await this.prismaService.triadGroup.findFirst({
			where: { id: triadGroupId, active: true },
		})
		if (!group) {
			throw new NotFoundException(`Active triad group ${triadGroupId} not found.`)
		}

		try {
			const created = await this.prismaService.triadDailySchedule.create({
				data: {
					puzzleDate,
					triadGroupId,
				},
				select: {
					id: true,
					puzzleDate: true,
					triadGroupId: true,
				},
			})
			return {
				id: created.id,
				puzzleDate: this.formatDbDateAsYmd(created.puzzleDate),
				triadGroupId: created.triadGroupId,
			}
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
				throw new ConflictException(`A puzzle is already scheduled for ${puzzleDateYmd}.`)
			}
			throw e
		}
	}

	/** Eastern-calendar “today” puzzle metadata for the landing page (challenge # = 100 + triadGroupId). */
	async getTodayPublicInfo(anonymousId?: string) {
		const puzzleDateStr = getEasternYmd()
		const puzzleDate = easternYmdToDbDate(puzzleDateStr)

		const schedule = await this.prismaService.triadDailySchedule.findUnique({
			where: { puzzleDate },
			select: { triadGroupId: true },
		})

		if (!schedule) {
			return { scheduled: false as const, puzzleDate: puzzleDateStr }
		}

		const base = {
			scheduled: true as const,
			puzzleDate: puzzleDateStr,
			triadGroupId: schedule.triadGroupId,
		}

		if (!anonymousId || !ANONYMOUS_ID_PATTERN.test(anonymousId)) {
			return base
		}

		const attempt = await this.prismaService.dailyTriadAttempt.findUnique({
			where: {
				anonymousId_puzzleDate: {
					anonymousId,
					puzzleDate,
				},
			},
			select: { status: true },
		})

		const hasCompletedDaily = attempt?.status === DailyAttemptStatus.WON || attempt?.status === DailyAttemptStatus.LOST

		return { ...base, hasCompletedDaily }
	}

	async deleteSchedule(id: number) {
		try {
			await this.prismaService.triadDailySchedule.delete({
				where: { id },
			})
			return { success: true as const }
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
				throw new NotFoundException(`Schedule ${id} not found.`)
			}
			throw e
		}
	}

	private formatDbDateAsYmd(d: Date): string {
		const y = d.getUTCFullYear()
		const m = String(d.getUTCMonth() + 1).padStart(2, '0')
		const day = String(d.getUTCDate()).padStart(2, '0')
		return `${y}-${m}-${day}`
	}
}
