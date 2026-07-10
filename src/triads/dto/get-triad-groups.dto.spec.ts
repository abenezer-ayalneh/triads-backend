import 'reflect-metadata'

import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { GetTriadGroupsDto } from './get-triad-groups.dto'

describe('GetTriadGroupsDto', () => {
	it('accepts a supported difficulty filter', async () => {
		const errors = await validate(plainToInstance(GetTriadGroupsDto, { difficulty: 'MEDIUM' }))

		expect(errors).toHaveLength(0)
	})

	it('rejects an unsupported difficulty filter', async () => {
		const errors = await validate(plainToInstance(GetTriadGroupsDto, { difficulty: 'RANDOM' }))

		expect(errors.some((error) => error.property === 'difficulty')).toBe(true)
	})
})
