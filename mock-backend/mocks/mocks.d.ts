import * as express from 'express';

type RouteExport = Mock[];

type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'TRACE' | 'OPTIONS';

type Mock = {
  id: string
  url: string | RegExp,
  method: Verb | Verb[],
  delay?: number,
  variants: Variant[]
}

type Variant = {
  id: string,
  handler?: 'default', // TODO: proxy
  delay?: number,
  response: Response | ResponseGenerator
}

type ResponseGenerator = (req: express.Request, res: express.Response, next: express.NextFunction) => void;

type Response = {
  status: number,
  headers?: {[name: string]: any},
  body: any,
};
