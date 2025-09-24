import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProxyService } from '../proxy/proxy.service';
import { delay, extractPhoneNumber, getHttpAgent } from 'src/common/utils/helper';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ICommentFromTiktok, IGetInfoFromTiktok } from './cronjob.service.i';

import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { LinkService } from '../links/links.service';
import { LinkEntity } from '../links/entities/links.entity';
dayjs.extend(utc);

@Injectable()
export class CronjobService {
  linksRunning = []
  private readonly logger = new Logger(CronjobService.name);
  constructor(
    private proxyService: ProxyService, 
    private readonly httpService: HttpService,
    private linkService: LinkService, 

  ) { }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async startSync() {
    const postsStarted = await this.linkService.getPostStarted()
    let oldLinksRunning = []

    oldLinksRunning = this.linksRunning

    const oldIdsSet = new Set(oldLinksRunning.map(item => item.id));
    const linksShouldRunning = postsStarted.filter(item => !oldIdsSet.has(item.id));
    this.linksRunning = postsStarted

    const postHandle = linksShouldRunning.map((link) => {
      return this.syncCmt(link)
    })

    return Promise.all(postHandle)
  }

  async syncCmt(link: LinkEntity) {
    while (true) {
      const linkRuning = this.linksRunning.find(item => item.id === link.id)
      if (!linkRuning) { break };

      try {
        const proxy = await this.proxyService.getRandomProxy()
        if (!proxy) continue;
        const httpsAgent = getHttpAgent(proxy)
        const response = await firstValueFrom(
          this.httpService.get(`https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id=${link.postId}&count=1000&device_id=7550562218283191570`, {
            httpsAgent
          })
        )
        const comments = response.data.comments
        const newestComment = (comments??[]).reduce((latest, current) => {
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
      } catch (error) {
        console.log(`Crawl comment with postId ${link.postId} Error.`, error)
      } finally {
        if (link.delayTime) {
          await delay(5 * 1000)
        }
      }
    }
  }
}
