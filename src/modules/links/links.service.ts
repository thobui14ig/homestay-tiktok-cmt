import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, MoreThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CrawType, HideBy, LinkEntity, LinkStatus, LinkType } from './entities/links.entity';

@Injectable()
export class LinkService {
  ukTimezone = 'Asia/Ho_Chi_Minh';
  constructor(
    @InjectRepository(LinkEntity)
    private repo: Repository<LinkEntity>,
    private conenction: DataSource
  ) { }

  getOne(id: number) {
    return this.repo.findOne({
      where: {
        id,
      },
    });
  }

  updateType(link: LinkEntity) {
    return this.repo.save(link)
  }

  getPostStarted(): Promise<LinkEntity[]> {
    return this.repo.find({
      where: {
        status: In([LinkStatus.Started, LinkStatus.Pending]),
        type: Not(LinkType.DIE),
        delayTime: MoreThanOrEqual(0),
        hideCmt: false,
        isDelete: false,
        crawType: CrawType.TIKTOK
      },
    })
  }

  getAllLinkPublicPostIdV1Null() {
    return this.repo.find({
      where: {
        status: In([LinkStatus.Started, LinkStatus.Pending]),
        type: LinkType.PUBLIC,
        postIdV1: IsNull(),
      }
    })
  }

  processTotalComment() {
    return this.conenction.query(`
      with k1 as(
	      select l.id as linkId, count(c.id) as totalComment from links l 
        join comments c 
        on c.link_id = l.id
        group by l.id  
      )
      update links l 
      join k1 on k1.linkId = l.id
      set 
      l.comment_count = k1.totalComment
    `, [])
  }
}
