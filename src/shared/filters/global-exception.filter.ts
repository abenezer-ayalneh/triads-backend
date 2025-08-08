import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library'
import { Response } from 'express'

import ValidationException from '../exceptions/validation.exception'
import FilterResponseInterface from './interfaces/filter-response.interface'

/**
 * Catch every exception and handle it here
 * and return a consistent error message
 */
@Catch()
export default class GlobalExceptionFilter implements ExceptionFilter {
	constructor(private readonly logger: Logger) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		let stack = null

		// Create the default response data structure
		const responseData: FilterResponseInterface = {
			statusCode: 500,
			data: 'Internal server error',
			error: 'Server Error',
		}

		if (exception instanceof ValidationException) {
			responseData.data = exception.getMessage
			responseData.statusCode = exception.getStatusCode
			responseData.error = exception.getError
		} else if (exception instanceof HttpException) {
			responseData.data = exception.getResponse()
			responseData.statusCode = exception.getStatus()
			responseData.error = 'HTTP Error'
			stack = exception.stack
		} else if (exception instanceof PrismaClientValidationError || exception instanceof PrismaClientKnownRequestError) {
			responseData.data = exception.message
			responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
			responseData.error = 'Database Error'
			stack = exception.stack
		}

		// Log the error before responding
		if (exception instanceof Error) {
			this.logger.error({ exception: { name: exception.name, message: exception.message } }, exception.stack)
		} else {
			this.logger.error({ exception: exception }, stack)
		}

		response.status(responseData.statusCode).json(responseData)
	}
}
