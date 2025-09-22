import { CrawType, ILink, LinkStatus } from "../shared/interfaces/link";
import http from "./http";

export interface ICreateLinkParams {
    links: {
        url: string
        delayTime: number
    }[]
    status: LinkStatus
    hideCmt: boolean
    thread: number
    tablePageId: number | null
    crawType: CrawType
}

export interface IGetLinkResponse {
    data: ILink[],
    totalCount: number
}

export const createLink = (links: ICreateLinkParams) =>
    http.post<ILink>(`/links`, links)
export const getLinks = (
    limit: number,
    offset: number,
    crawType: CrawType
) =>
    http.post<IGetLinkResponse>(`/links/query`, { limit, offset, crawType })
export const deleteLink = (id: number) => http.delete<null>(`/links/${id}`)
export const updateLink = (link: ILink) =>
    http.put(`/links`, link)