import { DAILY_CLASSIC_EXTRA_LIMIT } from './triads-daily.constants'

export type ClassicBlockedReason = 'daily_required' | 'capacity_reached' | null

export interface ClassicExtraUsageInfo {
	classicExtrasUsed: number
	classicExtrasRemaining: number
	classicExtrasLimit: number
	canPlayClassic: boolean
	classicBlockedReason: ClassicBlockedReason
}

export function buildClassicExtraUsageInfo(used: number, dailyScheduled: boolean, hasCompletedDaily: boolean): ClassicExtraUsageInfo {
	const limit = DAILY_CLASSIC_EXTRA_LIMIT
	const remaining = Math.max(0, limit - used)

	if (used >= limit) {
		return {
			classicExtrasUsed: used,
			classicExtrasRemaining: 0,
			classicExtrasLimit: limit,
			canPlayClassic: false,
			classicBlockedReason: 'capacity_reached',
		}
	}

	if (dailyScheduled && !hasCompletedDaily) {
		return {
			classicExtrasUsed: used,
			classicExtrasRemaining: remaining,
			classicExtrasLimit: limit,
			canPlayClassic: false,
			classicBlockedReason: 'daily_required',
		}
	}

	return {
		classicExtrasUsed: used,
		classicExtrasRemaining: remaining,
		classicExtrasLimit: limit,
		canPlayClassic: true,
		classicBlockedReason: null,
	}
}
