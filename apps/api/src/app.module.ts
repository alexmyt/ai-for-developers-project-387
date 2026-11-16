import { Module } from '@nestjs/common'
import { ClockModule } from './clock/clock.module'
import { HealthController } from './health/health.controller'
import { MeetingTypesModule } from './meeting-types/meeting-types.module'
import { OccupancyModule } from './occupancy/occupancy.module'
import { createWebStaticModule } from './web-static'

// Статика SPA подключается последней: wildcard-фолбэк на index.html не должен
// перехватывать роуты /api (ADR-0002).
const webStaticModule = createWebStaticModule()

@Module({
  imports: [
    ClockModule,
    MeetingTypesModule,
    OccupancyModule,
    ...(webStaticModule ? [webStaticModule] : []),
  ],
  controllers: [HealthController],
})
export class AppModule {}
