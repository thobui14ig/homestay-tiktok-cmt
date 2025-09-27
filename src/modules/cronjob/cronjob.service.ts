import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProxyService } from '../proxy/proxy.service';
import { delay, extractPhoneNumber, getHttpAgent } from 'src/common/utils/helper';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { LinkService } from '../links/links.service';
import { LinkEntity } from '../links/entities/links.entity';
import { RedisService } from 'src/infra/redis/redis.service';
import { ICommentFromTiktok } from './cronjob.service.i';
import { CommentEntity } from '../comments/entities/comment.entity';
import { CommentsModule } from '../comments/comments.module';
import { CommentsService } from '../comments/comments.service';
import { SocketService } from 'src/infra/socket/socket.service';
dayjs.extend(utc);

@Injectable()
export class CronjobService {
  linksRunning = []
  private readonly logger = new Logger(CronjobService.name);
  constructor(
    private proxyService: ProxyService, 
    private readonly httpService: HttpService,
    private linkService: LinkService, 
    private redisService: RedisService,
    private commentService: CommentsService,
    private readonly socketService: SocketService,
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
          this.httpService.get(`https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id=${link.postId}&count=1000&device_id=7550562218283191570`)
        )
        const comments = response.data.comments
        const newestComment = comments.reduce((latest, current) => {
          if (!latest) return current; 
          return current.create_time > latest.create_time ? current : latest;
        }, null);

        if (newestComment) {
          const res: ICommentFromTiktok = {
            postId: link.postId,
            userIdComment: newestComment.user.uid,
            userNameComment: newestComment.user.unique_id,
            commentId: newestComment.cid,
            phoneNumber: extractPhoneNumber(newestComment.text),
            commentMessage: newestComment.text,
            commentCreatedAt: dayjs(newestComment?.create_time * 1000).utc().format('YYYY-MM-DD HH:mm:ss'),
          }

          if (res) {
              const key = `${link.id}_${res.commentCreatedAt.replaceAll("-", "").replaceAll(" ", "").replaceAll(":", "")}`
              const isExistKey = await this.redisService.checkAndUpdateKey(key)
              if (!isExistKey) {
                // await this.insertComment(res, link)
                // this.socketService.emit('comment-group', message)
                console.log(res)

                this.socketService.emit('comment-tiktok', { ...res, userId: link.userId })
              }
          }
        }

      } catch (error) {
        console.log(`Crawl comment with postId ${link.postId} Error.`, error.message)
      } finally {
          await delay(5 * 1000)
      }
    }
  }

  insertComment(comment: ICommentFromTiktok, link: LinkEntity) {
    const commentEntity: Partial<CommentEntity> = {
        cmtId: comment.commentId,
        linkId: link.id,
        postId: link.postId,
        userId: link.userId,
        uid: comment.userIdComment,
        message: comment.commentMessage,
        phoneNumber: comment.phoneNumber,
        name: comment.userNameComment,
        timeCreated: comment.commentCreatedAt as any,
    }
    return this.commentService.insert(commentEntity)
  }
}
