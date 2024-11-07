import { HttpClient, HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, InjectionToken } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { toTodoDto, toTodoVm } from "./model.mappers";
import { PostDto, UserDto } from "../../interfaces/interfaces";


interface Mappers<TModel, TDto> {
  toDto: (vm: TModel) => TDto;
  fromDto: (dto: TDto) => TModel;
}

interface ConfigEntry<TModel, TDto> {
  route: string;
  allowedMethods: readonly MethodTypes[];
  mappers: Mappers<TModel, TDto>;
}

interface HttpOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  context?: HttpContext
};

interface FetchMethods<TModel> {
  GET: (httpOptions?: HttpOptions) => Observable<TModel[]>;
  GETBYID: (id: number, httpOptions?: HttpOptions) => Observable<TModel>;
  POST: (data: TModel, httpOptions?: HttpOptions) => Observable<TModel>;
  PATCH: (id: number, body: TModel, httpOptions?: HttpOptions) => Observable<TModel>;
  PUT: (id: number, body: TModel, httpOptions?: HttpOptions) => Observable<TModel>;
  DELETE: (id: number, httpOptions?: HttpOptions) => Observable<TModel>;
};

type ApiConfigType = {
  [key: string]: ConfigEntry<any, any>;
};

type MethodTypes = keyof FetchMethods<any>;

type AllowedMethodsMap<Method extends readonly MethodTypes[], TModel> = {
  [K in Method[number]]: FetchMethods<TModel>[K];
};

type AllowedMethodsPerEntry = {
  [KEY in keyof typeof apiConfig]:
    typeof apiConfig[KEY] extends ConfigEntry<infer TModel, infer TDto>
    ? AllowedMethodsMap<typeof apiConfig[KEY]['allowedMethods'], TModel>
    : never;
};

const apiConfig = {
  todos: {
    route: environment.baseUrl + '/todos',
    allowedMethods: ['GET', 'GETBYID', 'POST', 'PUT', 'DELETE'],
    mappers: {
      toDto: toTodoDto,
      fromDto: toTodoVm
    }
  },
  posts: {
    route: environment.baseUrl + '/posts',
    allowedMethods: ['GET', 'GETBYID'],
    mappers: {
      toDto: (post: PostDto) => post,
      fromDto: (post: PostDto) => post
    }
  },
  users: {
    route: environment.baseUrl + '/users',
    allowedMethods: ['GET', 'GETBYID', 'POST', 'PUT', 'DELETE'],
    mappers: {
      toDto: (user: UserDto) => user,
      fromDto: (user: UserDto) => user
    }
  },
  // Add more entities as needed
} as const satisfies ApiConfigType;


function createFetchFunctions<Method extends readonly MethodTypes[], TModel, TDto>(
  config: ConfigEntry<TModel, TDto>
): AllowedMethodsMap<Method, TModel> {
  const http = inject(HttpClient);

  const getList = (httpOptions?: HttpOptions) =>
    http.get<TDto[]>(config.route, { ...prepareRequestOptions(httpOptions) }).pipe(map((data: TDto[]) => data.map(config.mappers.fromDto)));

  const post = (method: string) => (body: TModel, httpOptions?: HttpOptions) =>
    http.request<TDto>(method, config.route, { body: config.mappers.toDto(body), ...prepareRequestOptions(httpOptions) }).pipe(map(config.mappers.fromDto));

  const byId = (method: string) => (id: number, httpOptions?: HttpOptions) =>
    http.request<TDto>(method, `${config.route}/${id}`, { ...prepareRequestOptions(httpOptions) }).pipe(map(config.mappers.fromDto));

  const byIdWithBody = (method: string) => (id: number, body: TModel, httpOptions?: HttpOptions) =>
    http.request<TDto>(method, `${config.route}/${id}`, { body: config.mappers.toDto(body), ...prepareRequestOptions(httpOptions) })
        .pipe(map(config.mappers.fromDto));

  const allMethods: FetchMethods<TModel> = {
    GET: getList,
    GETBYID: byId('GET'),
    POST: post('POST'),
    PATCH: byIdWithBody('PATCH'),
    PUT: byIdWithBody('PUT'),
    DELETE: byId('DELETE'),
  };

  return config.allowedMethods.reduce((acc, method: Method[number]) => {
    acc[method] = allMethods[method];
    return acc;
  }, {} as AllowedMethodsMap<Method, TModel>);
}

function createApiRoutes() {
  return (Object.keys(apiConfig) as Array<keyof typeof apiConfig>).reduce((acc, entryKey) => ({
    ...acc,
    [entryKey]: createFetchFunctions(apiConfig[entryKey] as ConfigEntry<any, any>),
  }), {} as AllowedMethodsPerEntry);
};

const defaultHeaders = new HttpHeaders();

function prepareRequestOptions(extraHttpOptions: HttpOptions = {}) {
  return {
    headers: Object.assign(defaultHeaders, extraHttpOptions.headers),
    params: extraHttpOptions.params,
    context: extraHttpOptions.context,
  };
}

export const API_FUNCTIONS = new InjectionToken('API_FUNCTIONS', {
  factory: () => createApiRoutes(),
});
