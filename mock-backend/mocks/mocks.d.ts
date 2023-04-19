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

type Variant = JsonVariant | TextVariant | StatusVariant | MiddlewareVariant | StaticVariant | FileVariant | ProxyVariant

interface VariantBase {
  id: string,
  delay?: number,
  type: string;
  options: unknown;
  disabled?: boolean,
}

interface JsonVariant extends VariantBase {
  type: 'json',
  options: Response<any>
}

interface TextVariant extends VariantBase {
  type: 'text',
  options: Response<string>
}

interface StatusVariant extends VariantBase {
  type: 'status',
  options: Response<never>
}

interface MiddlewareVariant extends VariantBase {
  type: 'middleware',
  options: {
    middleware: (req: express.Request, res: express.Response, next: express.NextFunction, core: unknown) => void;
  }
}

interface StaticVariant extends VariantBase {
  type: 'static',
  options: unknown,
}

interface FileVariant extends VariantBase {
  type: 'file',
  options: unknown,
}

interface ProxyVariant extends VariantBase {
  type: 'proxy',
  options: unknown,
}


type Response<T> = {
  status: number,
  headers?: { [name: string]: any },
  body: T,
};