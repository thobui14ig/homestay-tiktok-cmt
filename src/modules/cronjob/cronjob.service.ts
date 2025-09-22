import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProxyService } from '../proxy/proxy.service';
import { extractPhoneNumber, getHttpAgent } from 'src/common/utils/helper';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ICommentFromTiktok, IGetInfoFromTiktok } from './cronjob.service.i';

import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
dayjs.extend(utc);

@Injectable()
export class CronjobService {
  private readonly logger = new Logger(CronjobService.name);
  constructor(private proxyService: ProxyService, private readonly httpService: HttpService,) { }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async syncCmt() {
    const proxy = await this.proxyService.getRandomProxy()
    if (!proxy) return null
    const httpsAgent = getHttpAgent(proxy)
    const response = await firstValueFrom(
      this.httpService.get(`https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id=7487458017160547590&count=1000&device_id=7550562218283191570`, {
        httpsAgent
      })
    )
    const comments = response.data.comments
    const newestComment = comments.reduce((latest, current) => {
      return current.create_time > latest.create_time ? current : latest;
    });

    const res: ICommentFromTiktok = {
      userIdComment: newestComment.user.uid,
      userNameComment: newestComment.user.unique_id,
      commentId: newestComment.cid,
      phoneNumber: extractPhoneNumber(newestComment.text),
      commentMessage: newestComment.text,
      commentCreatedAt: dayjs(newestComment?.created_time).utc().format('YYYY-MM-DD HH:mm:ss'),
    }
    console.log("🚀 ~ CronjobService ~ handleCron ~ newestComment:", res)
  }
}
