/**
 * 通用 Axios 实例
 * 统一配置 baseURL、超时、请求/响应拦截器及错误处理
 */

import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

// 生产环境通过 nginx 代理，使用相对路径；开发环境指向本地后端
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── 请求拦截器 ──
http.interceptors.request.use(
  (config: AxiosRequestConfig) => config,
  (error) => Promise.reject(error),
);

// ── 响应拦截器 ──
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as Record<string, string> | undefined;
      const message =
        data?.error ?? data?.detail ?? error.message ?? "请求失败";
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);

// ── 快捷方法封装 ──

export const get = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return http
    .get<T, AxiosResponse<T>>(url, config)
    .then((r: AxiosResponse<T>) => r.data);
};

export const post = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return http
    .post<T, AxiosResponse<T>>(url, data, config)
    .then((r: AxiosResponse<T>) => r.data);
};

export const del = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return http
    .delete<T, AxiosResponse<T>>(url, config)
    .then((r: AxiosResponse<T>) => r.data);
};

export default http;
