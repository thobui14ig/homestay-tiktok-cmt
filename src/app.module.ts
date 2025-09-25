import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CronjobModule } from './modules/cronjob/cronjob.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ProxyModule } from './modules/proxy/proxy.module';
import { ProxyEntity } from './modules/proxy/entities/proxy.entity';
import { LinkModule } from './modules/links/links.module';
import { LinkEntity } from './modules/links/entities/links.entity';
import { BullModule } from '@nestjs/bull';
import { CommentsModule } from './modules/comments/comments.module';
import { CommentEntity } from './modules/comments/entities/comment.entity';


@Module({
  imports: [
    CronjobModule, ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: configService.get<string>('DB_TYPE') as any,
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
        username: configService.get<string>('DB_USER_NAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [ProxyEntity, LinkEntity, CommentEntity],

      }),
    }),
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    ProxyModule,
    ScheduleModule.forRoot(),
    LinkModule,
    CommentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
