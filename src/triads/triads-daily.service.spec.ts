import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'
import { TriadsDailyService } from './triads-daily.service'
import { easternYmdToDbDate, getEasternYmd } from './triads-daily-timezone'

type ScheduleRow = { id: number; puzzleDate: Date; triadGroupId: number }

function dateOnly(d: Date): string {
	return d.toISOString().slice(0, 10)
}

function addDaysYmd(baseYmd: string, days: number): string {
	const [y, m, d] = baseYmd.split('-').map(Number)
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function createPrismaMock(initialRows: Array<{ id: number; puzzleDateYmd: string; triadGroupId: number }>) {
	const rows: ScheduleRow[] = initialRows.map((r) => ({
		id: r.id,
		puzzleDate: easternYmdToDbDate(r.puzzleDateYmd),
		triadGroupId: r.triadGroupId,
	}))

	const sortAsc = () => rows.sort((a, b) => a.puzzleDate.getTime() - b.puzzleDate.getTime() || a.id - b.id)

	const prismaMock = {
		triadGroup: {
			findFirst: jest.fn(() => ({ id: 1, active: true })),
		},
		triadDailySchedule: {
			findUnique: jest.fn(({ where }: { where: { puzzleDate?: Date; id?: number } }) => {
				if (where.puzzleDate) {
					const row = rows.find((r) => dateOnly(r.puzzleDate) === dateOnly(where.puzzleDate))
					return row ? { triadGroupId: row.triadGroupId } : null
				}
				if (where.id !== undefined) {
					const row = rows.find((r) => r.id === where.id)
					if (!row) {
						return null
					}
					return { id: row.id, puzzleDate: row.puzzleDate, triadGroupId: row.triadGroupId }
				}
				return null
			}),
			count: jest.fn(({ where }: { where: { puzzleDate: { lte: Date } } }) => {
				const cutoff = where.puzzleDate.lte
				return rows.filter((r) => r.puzzleDate.getTime() <= cutoff.getTime()).length
			}),
			create: jest.fn(({ data }: { data: { puzzleDate: Date; triadGroupId: number } }) => {
				const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1
				const created = { id: nextId, puzzleDate: data.puzzleDate, triadGroupId: data.triadGroupId }
				rows.push(created)
				sortAsc()
				return created
			}),
			delete: jest.fn(({ where }: { where: { id: number } }) => {
				const idx = rows.findIndex((r) => r.id === where.id)
				if (idx === -1) {
					const error = new Error('not found') as Error & { code?: string }
					error.code = 'P2025'
					throw error
				}
				return rows.splice(idx, 1)[0]
			}),
			findMany: jest.fn(() => rows),
		},
		dailyTriadAttempt: {
			findUnique: jest.fn(() => null),
		},
		$queryRaw: jest.fn(({ values }: { values: unknown[] }) => {
			const offset = Number(values[0] ?? 0)
			const take = Number(values[1] ?? 50)
			sortAsc()
			const rankedAsc = rows.map((r, idx) => ({
				id: r.id,
				puzzleDate: r.puzzleDate,
				triadGroupId: r.triadGroupId,
				challengeNumber: BigInt(idx + 1),
			}))
			return rankedAsc.sort((a, b) => b.puzzleDate.getTime() - a.puzzleDate.getTime() || b.id - a.id).slice(offset, offset + take)
		}),
	}

	return { prismaMock, rows }
}

describe('TriadsDailyService (date-ordered challenge numbers)', () => {
	const buildService = async (prismaMock: unknown) => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [TriadsDailyService, { provide: PrismaService, useValue: prismaMock }],
		}).compile()
		return module.get(TriadsDailyService)
	}

	it('computes today challengeNumber by date order', async () => {
		const today = getEasternYmd()
		const { prismaMock } = createPrismaMock([
			{ id: 1, puzzleDateYmd: addDaysYmd(today, -1), triadGroupId: 10 },
			{ id: 2, puzzleDateYmd: today, triadGroupId: 11 },
		])
		const service = await buildService(prismaMock)

		const info = await service.getTodayPublicInfo()
		expect(info.scheduled).toBe(true)
		if (info.scheduled) {
			expect(info.challengeNumber).toBe(2)
		}
	})

	it('delete and reinsert date yields restored sequence 20,21,22 => 1,2,3', async () => {
		const { prismaMock, rows } = createPrismaMock([
			{ id: 1, puzzleDateYmd: '2026-04-20', triadGroupId: 1 },
			{ id: 2, puzzleDateYmd: '2026-04-21', triadGroupId: 1 },
			{ id: 3, puzzleDateYmd: '2026-04-22', triadGroupId: 1 },
		])
		const service = await buildService(prismaMock)

		await service.deleteSchedule(2)
		const listAfterDelete = await service.listSchedules(0, 50)
		const byDateDelete = [...listAfterDelete].sort((a, b) => a.puzzleDate.localeCompare(b.puzzleDate))
		expect(byDateDelete.map((r) => `${r.puzzleDate}:${r.challengeNumber}`)).toEqual(['2026-04-20:1', '2026-04-22:2'])

		await service.createSchedule('2026-04-21', 1)
		const listAfterReinsert = await service.listSchedules(0, 50)
		const byDateReinsert = [...listAfterReinsert].sort((a, b) => a.puzzleDate.localeCompare(b.puzzleDate))
		expect(byDateReinsert.map((r) => `${r.puzzleDate}:${r.challengeNumber}`)).toEqual(['2026-04-20:1', '2026-04-21:2', '2026-04-22:3'])
		expect(rows).toHaveLength(3)
	})

	it('throws NotFoundException for unknown schedule deletion', async () => {
		const { prismaMock } = createPrismaMock([])
		const service = await buildService(prismaMock)
		await expect(service.deleteSchedule(999)).rejects.toBeInstanceOf(NotFoundException)
	})
})
