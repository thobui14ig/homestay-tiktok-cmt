import { Module } from '@nestjs/common';
import { LinkService } from './links.service';
import { LinkEntity } from './entities/links.entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [TypeOrmModule.forFeature([LinkEntity])],
  controllers: [],
  providers: [LinkService],
  exports: [LinkService],
})
export class LinkModule { }
