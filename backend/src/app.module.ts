import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle, JobCard, GateLog } from './common/entities';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { JobCardModule } from './modules/job-card/job-card.module';
import { GateModule } from './modules/gate/gate.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { GateLogModule } from './modules/gate-log/gate-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'new_user'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_DATABASE', 'smart_garage'),
        entities: [Vehicle, JobCard, GateLog],
        synchronize: true,
      }),
    }),
    VehicleModule,
    JobCardModule,
    GateModule,
    WebsocketModule,
    GateLogModule,
  ],
})
export class AppModule {}
