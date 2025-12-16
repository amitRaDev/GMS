import { Module, Global } from '@nestjs/common';
import { GarageGateway } from './garage.gateway';

@Global()
@Module({
  providers: [GarageGateway],
  exports: [GarageGateway],
})
export class WebsocketModule {}
