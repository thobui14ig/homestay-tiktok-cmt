import { Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';
import { ProxyModule } from '../proxy/proxy.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ProxyModule, HttpModule],
  controllers: [],
  providers: [CronjobService],
})
export class CronjobModule { }
