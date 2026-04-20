declare module 'node-fetch' {
    import { Agent } from 'http';
    
    export interface RequestInit {
        method?: string;
        headers?: any;
        body?: any;
        redirect?: 'follow' | 'error' | 'manual';
        signal?: string;
        agent?: Agent;
        cookie?: string;
    }

    export interface Response {
        ok: boolean;
        status: number;
        statusText: string;
        headers: any;
        url: string;
        text(): Promise<string>;
        json(): Promise<any>;
    }

    export default function fetch(url: string, init?: RequestInit): Promise<Response>;
}