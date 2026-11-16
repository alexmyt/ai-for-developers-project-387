import { Module } from '@nestjs/common'
import { MeetingTypesModule } from '../meeting-types/meeting-types.module'
import { AvailabilityController } from './availability.controller'
import { AvailabilityService } from './availability.service'
import { BookingsController } from './bookings.controller'
import { BookingsService } from './bookings.service'

/**
 * Занятость (GLOSSARY.md): сетка слотов, окно записи, брони и их статусы
 * в одном модуле. Пишущая сторона (BookingsService: мьютекс по дате,
 * ADR-0003) и читающая (AvailabilityService: read model поверх броней) —
 * внутренние seam модуля. Наружу — три операции контракта: сетка занятости,
 * создание брони, предстоящие события владельца; тип встречи приходит
 * из отдельного модуля через getOrFail().
 */
@Module({
  imports: [MeetingTypesModule],
  controllers: [BookingsController, AvailabilityController],
  providers: [BookingsService, AvailabilityService],
})
export class OccupancyModule {}
