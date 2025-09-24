import { Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';
import { ProxyModule } from '../proxy/proxy.module';
import { HttpModule } from '@nestjs/axios';
import { LinkModule } from '../links/links.module';

@Module({
  imports: [ProxyModule, HttpModule, LinkModule],
  controllers: [],
  providers: [CronjobService],
})
export class CronjobModule { }
