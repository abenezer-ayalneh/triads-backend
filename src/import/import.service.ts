import { Injectable, Logger } from '@nestjs/common'
import { Difficulty } from '@prisma/client'
import * as XLSX from 'xlsx'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ImportService {
	private readonly logger = new Logger(ImportService.name)

	constructor(private readonly prismaService: PrismaService) {}

	/**
	 * Maps sheet name to Difficulty enum value (case-insensitive)
	 * @param sheetName - The name of the Excel sheet
	 * @returns Difficulty enum value or null if sheet name doesn't match
	 */
	private mapSheetNameToDifficulty(sheetName: string): Difficulty | null {
		const normalizedName = sheetName.toLowerCase().trim()
		switch (normalizedName) {
			case 'easy':
				return Difficulty.EASY
			case 'medium':
				return Difficulty.MEDIUM
			case 'hard':
				return Difficulty.HARD
			default:
				return null
		}
	}

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

			if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
				throw new Error('Excel file does not contain any worksheets')
			}

			// Track statistics per difficulty level
			const stats = {
				easy: 0,
				medium: 0,
				hard: 0,
				total: 0,
			}
			const allTriadGroups = []

			// Process each sheet in the workbook
			for (const sheetName of workbook.SheetNames) {
				const difficulty = this.mapSheetNameToDifficulty(sheetName)

				// Skip sheets that don't match Easy/Medium/Hard
				if (!difficulty) {
					this.logger.warn(`Skipping sheet "${sheetName}" - not a recognized difficulty level (Easy/Medium/Hard)`)
					continue
				}

				const worksheet = workbook.Sheets[sheetName]
				if (!worksheet) {
					this.logger.warn(`Sheet "${sheetName}" exists but has no data`)
					continue
				}

				const data = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { header: 'A' })

				// Limit processing to prevent memory issues
				const maxRows = 10000
				if (data.length > maxRows) {
					this.logger.warn(`Sheet "${sheetName}" contains ${data.length} rows, processing only first ${maxRows} rows`)
				}

				const triadGroups: any[] = []
				let currentTriadIds: number[] = []
				const rowsToProcess = Math.min(data.length, maxRows)

				// Process each row in the current sheet
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

					// If we have 4 triads, create a triad group with the appropriate difficulty
					if (currentTriadIds.length === 4) {
						const triadGroup = await this.prismaService.triadGroup.create({
							data: {
								triad1Id: currentTriadIds[0],
								triad2Id: currentTriadIds[1],
								triad3Id: currentTriadIds[2],
								triad4Id: currentTriadIds[3],
								difficulty,
							},
						})

						triadGroups.push(triadGroup)
						allTriadGroups.push(triadGroup)

						// Update statistics
						stats.total++
						if (difficulty === Difficulty.EASY) {
							stats.easy++
						} else if (difficulty === Difficulty.MEDIUM) {
							stats.medium++
						} else if (difficulty === Difficulty.HARD) {
							stats.hard++
						}

						currentTriadIds = [] // Reset for next group
					}
				}

				this.logger.log(`Processed sheet "${sheetName}" (${difficulty}): ${triadGroups.length} triad groups`)
			}

			// Validate that at least one valid sheet was processed
			if (stats.total === 0) {
				throw new Error('No valid sheets found. Expected sheets named Easy, Medium, or Hard (case-insensitive)')
			}

			// Explicitly clear workbook from memory
			workbook = null

			return {
				success: true,
				message: `Imported ${stats.total} triad groups successfully (Easy: ${stats.easy}, Medium: ${stats.medium}, Hard: ${stats.hard})`,
				triadGroups: allTriadGroups,
				statistics: {
					total: stats.total,
					easy: stats.easy,
					medium: stats.medium,
					hard: stats.hard,
				},
			}
		} catch (error) {
			this.logger.error(`Error importing triads: ${error}`)
			// Ensure workbook is cleared even on error
			workbook = null
			throw error
		}
	}
}
