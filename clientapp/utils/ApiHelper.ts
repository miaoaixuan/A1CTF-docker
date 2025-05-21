import { Api } from "./A1API";

export const api = new Api({
    baseURL: "/",
    withCredentials: true
});

export const sAPI = new Api({
    baseURL: "https://www.a1natas.com",
    withCredentials: true
});


export interface ErrorMessage {
    code: number;
    message: string;
}