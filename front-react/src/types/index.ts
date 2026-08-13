export type ResultVO<T> = {
  code: number;
  message?: string;
  data: T;
};

export type LoginResp = {
  id: number;
  token: string;
  username: string;
};

export type CommentVO = {
  id: number;
  content: string;
  username: string;
  website?: string;
  replyTo: string;
  createdAt: string;
  updatedAt: string;
  memoId: number;
  author: number;
};

export type MemoVO = {
  id: number;
  content: string;
  location: string;
  imgs: string;
  favCount: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  externalFavicon: string;
  pinned: string;
  ext: string;
  externalTitle: string;
  externalUrl: string;
  showType: number;
  user: UserVO;
  comments: Array<CommentVO>;
  tags: string;
  imgConfigs: Array<{
    url: string;
    thumbUrl: string;
  }>;
};

export type UserVO = {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string;
  slogan: string;
  coverUrl: string;
  email: string;
};

export type SysConfigVO = {
  version: string;
  commitId: string;
  adminUserName: string;
  title: string;
  favicon: string;
  beiAnNo: string;
  css: string;
  js: string;
  rss: string;
  enableAutoLoadNextPage: boolean;
  enableS3: boolean;
  enableGoogleRecaptcha: boolean;
  googleSiteKey: string;
  googleSecretKey?: string;
  enableAmap?: boolean;
  amapKey?: string;
  amapSecurityJsCode?: string;
  enableComment: boolean;
  maxCommentLength: number;
  memoMaxHeight: number;
  commentOrder: 'desc' | 'asc';
  timeFormat: 'timeAgo' | 'time';
  s3: {
    domain?: string;
    endpoint?: string;
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    thumbnailSuffix?: string;
  };
  enableEmail: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  // OAuth 配置
  enableOAuth?: boolean;
  oauthServerUrl?: string;
  enableGithubOAuth?: boolean;
  githubClientId?: string;
  githubClientSecret?: string;
  enableGoogleOAuth?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  enableQqOAuth?: boolean;
  qqAppId?: string;
  qqAppKey?: string;
  enableWechatOAuth?: boolean;
  wechatAppId?: string;
  wechatAppSecret?: string;
  enableDouyinOAuth?: boolean;
  douyinClientKey?: string;
  douyinClientSecret?: string;
  enableBilibiliOAuth?: boolean;
  bilibiliClientId?: string;
  bilibiliClientSecret?: string;
};

export type MetingJSDTO = {
  id: string | undefined;
  api: string | undefined;
  server: 'netease' | 'tencent' | 'kugou' | 'xiami' | 'baidu' | undefined;
  type: 'song' | 'playlist' | 'album' | 'search' | 'artist' | undefined;
};

export type MetingMusicServer = Exclude<MetingJSDTO['server'], undefined>;
export type MetingMusicType = Exclude<MetingJSDTO['type'], undefined>;

export type ExtDTO = {
  music?: MusicDTO;
  doubanBook?: DoubanBook;
  doubanMovie?: DoubanMovie;
  video?: Video;
};

export type MusicDTO = {
  id?: string;
  server?: MetingMusicServer;
  type?: MetingMusicType;
  api?: string;
};

export type DoubanBook = {
  url?: string;
  id?: string;
  title?: string;
  desc?: string;
  image?: string;
  isbn?: string;
  author?: string;
  rating?: string;
  pubDate?: string;
  keywords?: string;
};

export type DoubanMovie = {
  url?: string;
  id?: string;
  title?: string;
  desc?: string;
  image?: string;
  director?: string;
  releaseDate?: string;
  rating?: string;
  pubDate?: string;
  actors?: string;
  runtime?: string;
};

export type Video = {
  type: 'youtube' | 'bilibili' | 'online';
  value: string;
};

export type VideoType = Video['type'];

export type Friend = {
  id: number;
  name: string;
  icon: string;
  url: string;
  desc: string;
};

export type UpdateCheckResult = {
  hasUpdate: boolean;
  currentCommit: string;
  latestCommit: string;
  currentBranch: string;
  logs: string[];
};

export type UpdateStatus = {
  stage: 'idle' | 'starting' | 'pulling' | 'building_frontend' | 'building_backend' | 'replacing' | 'done' | 'failed';
  message: string;
  logs: string[];
};

export type UpdateConfig = {
  repoUrl: string;
  branch: string;
};

export type CommentLogVO = {
  id: number;
  memoId: number;
  username: string;
  email: string;
  ip: string;
  content: string;
  createdAt: string;
};

