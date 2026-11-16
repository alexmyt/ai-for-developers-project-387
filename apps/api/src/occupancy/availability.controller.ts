import { Controller, Get, Query } from '@nestjs/common'
import { AvailabilityService } from './availability.service'
import type { Availability } from './availability'
import { validationError } from '../validation/validation'

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /** Сетка на окно записи одним ответом (спецификация §7). */
  @Get()
  getAvailability(@Query('meetingTypeId') meetingTypeId: string | undefined): Availability {
    if (!meetingTypeId) {
      // Отсутствующий параметр — ошибка формы запроса (спецификация §7):
      // общий конверт validation_error с одним входом.
      throw validationError('Укажите параметр запроса meetingTypeId')
    }
    return this.availabilityService.get(meetingTypeId)
  }
}
