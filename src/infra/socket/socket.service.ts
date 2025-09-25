import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { io } from "socket.io-client";

@Injectable()
export class SocketService {
    socket1: any = null;

    constructor(private configService: ConfigService) {
        const ip = this.configService.get("IP_SOCKET_SERVER")
        this.socket1 = this.createSocket(ip)
    }

    emit(key: string, payload: any) {
        // this.socket1.emit(key, payload)
        console.log(payload)
    }

    createSocket(ip: string) {
        const socket = io(`http://${ip}:9000`, {
            secure: true,
        })
        socket.on('connect', () => {
            console.log('Connected to server admin page!.')
        })
        socket.on('error', (error) => {
            console.error('Socket connection error:', error)
        })
        socket.on('disconnect', () => {
            console.log('Disconnected from socket')
        })

        return socket
    }
}