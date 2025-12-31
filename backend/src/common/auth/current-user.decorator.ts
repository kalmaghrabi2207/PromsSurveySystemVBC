import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type CurrentUserShape = {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
};

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user as CurrentUserShape | undefined;
});

