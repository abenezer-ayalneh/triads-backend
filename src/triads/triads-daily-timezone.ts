import { addDays } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

const EASTERN_TZ = 'America/New_York'

/** Calendar date string (YYYY-MM-DD) in US Eastern time for "now". */
export function getEasternYmd(now: Date = new Date()): string {
	return formatInTimeZone(now, EASTERN_TZ, 'yyyy-MM-dd')
}

/** UTC `Date` at noon on the given Eastern calendar day (stable key for `@db.Date`). */
export function easternYmdToDbDate(ymd: string): Date {
	const [y, m, d] = ymd.split('-').map(Number)
	return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
}

/** Next calendar-day start (00:00) in Eastern, as an instant in time. */
export function getNextEasternMidnightIso(now: Date = new Date()): string {
	const todayYmd = getEasternYmd(now)
	const tomorrowAnchor = addDays(fromZonedTime(`${todayYmd}T12:00:00`, EASTERN_TZ), 1)
	const tomorrowYmd = formatInTimeZone(tomorrowAnchor, EASTERN_TZ, 'yyyy-MM-dd')
	return fromZonedTime(`${tomorrowYmd}T00:00:00`, EASTERN_TZ).toISOString()
}
