import { Transform } from 'class-transformer'

/**
 * Decorator that transforms string values to uppercase
 * Can be used on string properties or string arrays
 */
export function ToUpperCase() {
	return Transform(({ value }: { value: unknown }) => {
		if (typeof value === 'string') {
			return value.toUpperCase()
		}
		if (Array.isArray(value)) {
			return value.map((item: unknown) => (typeof item === 'string' ? item.toUpperCase() : item))
		}
		return value
	})
}
