import { Injectable, Logger } from '@nestjs/common'
import * as XLSX from 'xlsx'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ImportService {
	private readonly logger = new Logger(ImportService.name)

	constructor(private readonly prismaService: PrismaService) {}

	async importTriadsFromExcel(file: Express.Multer.File) {
		try {
			// Read the Excel file
			const workbook = XLSX.read(file.buffer, { type: 'buffer' })
			const worksheet = workbook.Sheets[workbook.SheetNames[0]]
			const data = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { header: 'A' })

			const triadGroups = []
			let currentTriadIds: number[] = []

			// Process each row
			for (let i = 0; i < data.length; i++) {
				const row = data[i]

				// Skip empty rows
				if (!row.A || row.A.toString().trim() === '') continue

				// Convert to uppercase
				const keyword = row.A.toString().trim().toUpperCase()
				const phrase1 = row.B ? row.B.toString().trim().toUpperCase() : ''
				const phrase2 = row.C ? row.C.toString().trim().toUpperCase() : ''
				const phrase3 = row.D ? row.D.toString().trim().toUpperCase() : ''

				// Create fullPhrases array
				const fullPhrases = [phrase1, phrase2, phrase3].filter(Boolean)
				// Create cues array (phrases with keyword removed)
				const cues = fullPhrases.map((phrase) => {
					return phrase.replace(keyword, '').trim()
				})

				// Create triad in database
				const triad = await this.prismaService.triad.create({
					data: {
						keyword,
						fullPhrases,
						cues,
					},
				})

				// Add triad ID to current group
				currentTriadIds.push(triad.id)

				// If we have 4 triads, create a triad group
				if (currentTriadIds.length === 4) {
					const triadGroup = await this.prismaService.triadGroup.create({
						data: {
							triad1Id: currentTriadIds[0],
							triad2Id: currentTriadIds[1],
							triad3Id: currentTriadIds[2],
							triad4Id: currentTriadIds[3],
						},
					})

					triadGroups.push(triadGroup)
					currentTriadIds = [] // Reset for next group
				}
			}

			return {
				success: true,
				message: `Imported ${triadGroups.length} triad groups successfully`,
				triadGroups,
			}
		} catch (error) {
			this.logger.error(`Error importing triads: ${error}`)
			throw error
		}
	}
}
