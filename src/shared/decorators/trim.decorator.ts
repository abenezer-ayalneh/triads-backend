import { Transform } from 'class-transformer'

/**
 * Trims leading/trailing whitespace from strings (or strings inside an array).
 * Does not touch internal whitespace — full phrases may legitimately contain spaces.
 */
export function Trim() {
	return Transform(({ value }: { value: unknown }) => {
		if (typeof value === 'string') {
			return value.trim()
		}
		if (Array.isArray(value)) {
			return value.map((item: unknown) => (typeof item === 'string' ? item.trim() : item))
		}
		return value
	})
}
