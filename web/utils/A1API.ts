/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum NoticeCategory {
  FirstBlood = "FirstBlood",
  SecondBlood = "SecondBlood",
  ThirdBlood = "ThirdBlood",
  NewChallenge = "NewChallenge",
  NewHint = "NewHint",
  NewAnnouncement = "NewAnnouncement",
}

export enum ParticipationStatus {
  UnRegistered = "UnRegistered",
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Participated = "Participated",
  Banned = "Banned",
}

export enum ChallengeContainerType {
  DYNAMIC_CONTAINER = "DYNAMIC_CONTAINER",
  STATIC_CONTAINER = "STATIC_CONTAINER",
  NO_CONTAINER = "NO_CONTAINER",
}

export enum ChallengeCategory {
  MISC = "MISC",
  CRYPTO = "CRYPTO",
  PWN = "PWN",
  WEB = "WEB",
  REVERSE = "REVERSE",
  FORENSICS = "FORENSICS",
  HARDWARE = "HARDWARE",
  MOBILE = "MOBILE",
  PPC = "PPC",
  AI = "AI",
  PENTENT = "PENTENT",
  OSINT = "OSINT",
}

export enum JudgeType {
  DYNAMIC = "DYNAMIC",
  SCRIPT = "SCRIPT",
}

/**
 * Type of the attachment:
 * - STATICFILE: Static file stored on server
 * - DYNAMICFILE: Dynamically generated file
 * - REMOTEFILE: File hosted on external server
 * @example "STATICFILE"
 */
export enum AttachmentType {
  STATICFILE = "STATICFILE",
  DYNAMICFILE = "DYNAMICFILE",
  REMOTEFILE = "REMOTEFILE",
}

/** User login form */
export interface UserLogin {
  username: string;
  password: string;
  captcha?: string;
}

/** User register form */
export interface UserRegister {
  username: string;
  password: string;
  captcha?: string;
  email: string;
}

export interface Attachment {
  attach_hash?: string | null;
  attach_name: string;
  /**
   * Type of the attachment:
   * - STATICFILE: Static file stored on server
   * - DYNAMICFILE: Dynamically generated file
   * - REMOTEFILE: File hosted on external server
   */
  attach_type: AttachmentType;
  attach_url: string;
  generate_script?: string | null;
}

export interface ExposePort {
  name: string;
  port: number;
}

export interface Container {
  command?: string | null;
  env?: EnvironmentItem[];
  expose_ports: ExposePort[];
  image: string;
  name: string;
  cpu_limit?: number;
  memory_limit?: number;
  storage_limit?: number;
}

export interface JudgeConfig {
  flag_template: string;
  judge_script?: string | null;
  judge_type: JudgeType;
}

export interface EnvironmentItem {
  name: string;
  value: string;
}

export interface AdminChallengeSimpleInfo {
  challenge_id: number;
  name: string;
  description: string;
  category: ChallengeCategory;
  /** @format date-time */
  create_time: string;
}

export interface AdminChallengeConfig {
  attachments?: Attachment[];
  category: ChallengeCategory;
  challenge_id?: number;
  container_config: Container[];
  /** @format date-time */
  create_time?: string;
  description: string;
  judge_config: JudgeConfig;
  name: string;
  type_?: number;
}

export interface ErrorMessage {
  code: number;
  message: string;
}

export interface GameStage {
  stage_name: string;
  /** @format date-time */
  start_time: string;
  /** @format date-time */
  end_time: string;
}

export interface AdminDetailGameChallenge {
  challenge_id: number;
  challenge_name: string;
  /** @format double */
  total_score: number;
  /** @format double */
  cur_score: number;
  hints?: {
    content: string;
    /** @format date-time */
    create_time: string;
    visible: boolean;
  }[];
  belong_stage?: string;
  solve_count?: number;
  visible?: boolean;
  category?: ChallengeCategory;
  judge_config?: JudgeConfig;
}

export interface AddGameChallengePayload {
  challenge_id: number;
  game_id: number;
}

export interface AdminFullGameInfo {
  /** @format int64 */
  game_id: number;
  name: string;
  summary?: string | null;
  description?: string | null;
  poster?: string | null;
  invite_code?: string | null;
  /** @format date-time */
  start_time: string;
  /** @format date-time */
  end_time: string;
  practice_mode: boolean;
  team_number_limit: number;
  container_number_limit: number;
  require_wp: boolean;
  /** @format date-time */
  wp_expire_time: string;
  visible: boolean;
  stages: GameStage[];
  challenges?: AdminDetailGameChallenge[];
}

export interface GameSimpleInfo {
  /** @format int64 */
  game_id: number;
  name: string;
  summary: string | null;
  poster?: string | null;
  /** @format date-time */
  start_time: string;
  /** @format date-time */
  end_time: string;
  visible: boolean;
}

export interface SolveRecord {
  user_id: string;
  game_id: number;
  /** @format date-time */
  solve_time: string;
  challenge_id: number;
  /** @format float */
  score: number;
  solve_rank: number;
}

export interface UserSimpleGameChallenge {
  challenge_id: number;
  challenge_name: string;
  /** @format double */
  total_score: number;
  /** @format double */
  cur_score: number;
  belong_stage?: string;
  solve_count?: number;
  category?: ChallengeCategory;
}

export interface UserAttachmentConfig {
  /**
   * The name of the attachment
   * @example "example.pdf"
   */
  attach_name: string;
  /**
   * Type of the attachment:
   * - STATICFILE: Static file stored on server
   * - DYNAMICFILE: Dynamically generated file
   * - REMOTEFILE: File hosted on external server
   */
  attach_type: AttachmentType;
  /**
   * URL of the attachment (if applicable)
   * @example "https://example.com/files/example.pdf"
   */
  attach_url?: string | null;
  /**
   * Hash of the attachment content
   * @example "a1b2c3d4e5f6"
   */
  attach_hash?: string | null;
  /**
   * Unique hash for download authorization
   * @example "d4e5f6a1b2c3"
   */
  download_hash?: string | null;
}

export interface UserDetailGameChallenge {
  challenge_id: number;
  challenge_name: string;
  description?: string;
  /** @format double */
  total_score: number;
  /** @format double */
  cur_score: number;
  hints?: {
    content: string;
    /** @format date-time */
    create_time: string;
    visible: boolean;
  }[];
  belong_stage?: string;
  solve_count?: number;
  category?: ChallengeCategory;
  container_type?: ChallengeContainerType;
  containers?: ExposePortInfo[];
  attachments?: UserAttachmentConfig[];
}

export interface UserTeamInfo {
  /** @format int64 */
  team_id: number;
  /** @format int64 */
  game_id: number;
  team_name: string;
  team_avatar?: string | null;
  team_slogan?: string | null;
  team_description?: string | null;
  team_members?: string[] | null;
  /** @format double */
  team_score: number;
  team_hash: string;
  invite_code?: string | null;
  team_status: ParticipationStatus;
}

export interface UserFullGameInfo {
  /** @format int64 */
  game_id: number;
  name: string;
  summary?: string | null;
  description?: string | null;
  poster?: string | null;
  /** @format date-time */
  start_time: string;
  /** @format date-time */
  end_time: string;
  practice_mode: boolean;
  team_number_limit: number;
  container_number_limit: number;
  require_wp: boolean;
  /** @format date-time */
  wp_expire_time: string;
  visible: boolean;
  stages: GameStage[];
  team_status: ParticipationStatus;
  team_info?: UserTeamInfo;
}

export interface GameNotice {
  /** @format int64 */
  notice_id: number;
  notice_category: NoticeCategory;
  data: string[];
  /** @format date-time */
  create_time: string;
}

export interface CreateGameTeamPayload {
  name: string;
  description: string;
  slogan: string;
}

export interface ExposePortInfo {
  container_name?: string;
  container_port?: {
    port_name: string;
    port: number;
    ip: string;
  }[];
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:7777/",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title A1CTF API
 * @version 1.0
 * @baseUrl http://localhost:7777/
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * No description
     *
     * @tags auth
     * @name UserLogin
     * @summary Login
     * @request POST:/api/auth/login
     */
    userLogin: (data: UserLogin, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name UserRegister
     * @summary Register
     * @request POST:/api/auth/register
     */
    userRegister: (data: UserRegister, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  admin = {
    /**
     * @description Create a new challenge with attachments, container configurations and judge configuration.
     *
     * @tags admin
     * @name CreateChallenge
     * @summary Create a new challenge
     * @request POST:/api/admin/challenge/create
     */
    createChallenge: (data: AdminChallengeConfig, params: RequestParams = {}) =>
      this.request<
        {
          challenge_id?: number;
          /** @format date-time */
          create_at?: string;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/challenge/create`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name GetChallengeInfo
     * @summary Get challenge info
     * @request GET:/api/admin/challenge/{challenge_id}
     */
    getChallengeInfo: (challengeId: number, params: RequestParams = {}) =>
      this.request<
        {
          code: number;
          data: AdminChallengeConfig;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/challenge/${challengeId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name DeleteChallenge
     * @summary Delete a exist challenge
     * @request DELETE:/api/admin/challenge/{challenge_id}
     */
    deleteChallenge: (challengeId: number, params: RequestParams = {}) =>
      this.request<
        {
          code?: number;
          message?: string;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/challenge/${challengeId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name UpdateChallenge
     * @summary Update a exist challenge
     * @request PUT:/api/admin/challenge/{challenge_id}
     */
    updateChallenge: (
      challengeId: number,
      data: AdminChallengeConfig,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code?: number;
          message?: string;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/challenge/${challengeId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name ListChallenge
     * @summary List challenges
     * @request POST:/api/admin/challenge/list
     */
    listChallenge: (
      data: {
        size: number;
        offset: number;
        category?: ChallengeCategory;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code: number;
          data: AdminChallengeSimpleInfo[];
        },
        void | ErrorMessage
      >({
        path: `/api/admin/challenge/list`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name SearchChallenges
     * @summary Search a challenge
     * @request POST:/api/admin/challenge/search
     */
    searchChallenges: (
      data: {
        keyword: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code: number;
          data: {
            challenge_id: number;
            name: string;
            category: ChallengeCategory;
            /** @format date-time */
            create_time: string;
          }[];
        },
        void | ErrorMessage
      >({
        path: `/api/admin/challenge/search`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name ListGames
     * @summary List games
     * @request POST:/api/admin/game/list
     */
    listGames: (
      data: {
        size: number;
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code: number;
          data: GameSimpleInfo[];
        },
        void | ErrorMessage
      >({
        path: `/api/admin/game/list`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new game.
     *
     * @tags admin
     * @name CreateGame
     * @summary Create a new game
     * @request POST:/api/admin/game/create
     */
    createGame: (data: AdminFullGameInfo, params: RequestParams = {}) =>
      this.request<
        {
          game_id?: number;
          /** @format date-time */
          create_at?: string;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/game/create`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a game info
     *
     * @tags admin
     * @name GetGameInfo
     * @summary Get a game info
     * @request GET:/api/admin/game/{game_id}
     */
    getGameInfo: (gameId: number, params: RequestParams = {}) =>
      this.request<
        {
          code: number;
          data: AdminFullGameInfo;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/game/${gameId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a game
     *
     * @tags admin
     * @name UpdateGame
     * @summary Update a game
     * @request PUT:/api/admin/game/{game_id}
     */
    updateGame: (
      gameId: number,
      data: AdminFullGameInfo,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code: number;
          data: string;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/game/${gameId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Add a challenge to a game
     *
     * @tags admin
     * @name AddGameChallenge
     * @summary Add a challenge to a game
     * @request PUT:/api/admin/game/{game_id}/challenge/{challenge_id}
     */
    addGameChallenge: (
      gameId: number,
      challengeId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code: number;
          data: AdminDetailGameChallenge;
        },
        void | ErrorMessage
      >({
        path: `/api/admin/game/${gameId}/challenge/${challengeId}`,
        method: "PUT",
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * No description
     *
     * @tags user
     * @name UserListGames
     * @summary List games
     * @request GET:/api/game/list
     */
    userListGames: (params: RequestParams = {}) =>
      this.request<
        {
          code: number;
          data: GameSimpleInfo[];
        },
        void | ErrorMessage
      >({
        path: `/api/game/list`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get a game info with team info
     *
     * @tags user
     * @name UserGetGameInfoWithTeamInfo
     * @summary Get a game info with team info
     * @request GET:/api/game/{game_id}
     */
    userGetGameInfoWithTeamInfo: (gameId: number, params: RequestParams = {}) =>
      this.request<
        {
          code: number;
          data: UserFullGameInfo;
        },
        void | ErrorMessage
      >({
        path: `/api/game/${gameId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get game challenges
     *
     * @tags user
     * @name UserGetGameChallenges
     * @summary Get game challenges
     * @request GET:/api/game/{game_id}/challenges
     */
    userGetGameChallenges: (gameId: number, params: RequestParams = {}) =>
      this.request<
        {
          code: number;
          data: UserSimpleGameChallenge[];
        },
        void | ErrorMessage
      >({
        path: `/api/game/${gameId}/challenges`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get a game challenge
     *
     * @tags user
     * @name UserGetGameChallenge
     * @summary Get a game challenge
     * @request GET:/api/game/{game_id}/challenge/{challenge_id}
     */
    userGetGameChallenge: (
      gameId: number,
      challengeId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code: number;
          data: UserDetailGameChallenge;
        },
        void | ErrorMessage
      >({
        path: `/api/game/${gameId}/challenge/${challengeId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get game notices
     *
     * @tags user
     * @name UserGetGameNotices
     * @summary Get game notices
     * @request GET:/api/game/{game_id}/notices
     */
    userGetGameNotices: (gameId: number, params: RequestParams = {}) =>
      this.request<
        {
          code: number;
          data: GameNotice[];
        },
        void | ErrorMessage
      >({
        path: `/api/game/${gameId}/notices`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a team for a game
     *
     * @tags user
     * @name UserGameCreateTeam
     * @summary Create a team for a game
     * @request POST:/api/game/{game_id}/createTeam
     */
    userGameCreateTeam: (
      gameId: number,
      data: CreateGameTeamPayload,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          code: number;
          data: GameNotice[];
        },
        void | ErrorMessage
      >({
        path: `/api/game/${gameId}/createTeam`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
