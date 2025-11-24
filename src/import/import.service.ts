import { Injectable, Logger } from '@nestjs/common'
import * as XLSX from 'xlsx'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ImportService {
	private readonly logger = new Logger(ImportService.name)

	constructor(private readonly prismaService: PrismaService) {}

	async importTriadsFromExcel(file: Express.Multer.File) {
		// Validate file size to prevent memory issues (limit to 10MB)
		const maxFileSize = 10 * 1024 * 1024 // 10MB
		if (file.buffer.length > maxFileSize) {
			throw new Error('File size exceeds maximum allowed size of 10MB')
		}

		let workbook: XLSX.WorkBook | null = null
		try {
			// Read the Excel file with memory-efficient options
			workbook = XLSX.read(file.buffer, {
				type: 'buffer',
				cellDates: false, // Don't parse dates to reduce memory
				cellNF: false, // Don't parse number formats
				cellStyles: false, // Don't parse styles
			})

			const worksheet = workbook.Sheets[workbook.SheetNames[0]]
			if (!worksheet) {
				throw new Error('Excel file does not contain any worksheets')
			}

			const data = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { header: 'A' })

			// Limit processing to prevent memory issues
			const maxRows = 10000
			if (data.length > maxRows) {
				this.logger.warn(`File contains ${data.length} rows, processing only first ${maxRows} rows`)
			}

			const triadGroups = []
			let currentTriadIds: number[] = []
			const rowsToProcess = Math.min(data.length, maxRows)

			// Process each row
			for (let i = 0; i < rowsToProcess; i++) {
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

			// Explicitly clear workbook from memory
			workbook = null

			return {
				success: true,
				message: `Imported ${triadGroups.length} triad groups successfully`,
				triadGroups,
			}
		} catch (error) {
			this.logger.error(`Error importing triads: ${error}`)
			// Ensure workbook is cleared even on error
			workbook = null
			throw error
		}
	}
}
