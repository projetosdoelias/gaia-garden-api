import { JwtGuard } from './jwt.guard';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as any;
    guard = new JwtGuard(jwtService);
  });

  const makeContext = (request: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as any;

  it('should throw UnauthorizedException when no token is provided', async () => {
    const context = makeContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when the token is invalid', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('bad'));
    const request = {
      headers: { authorization: 'Bearer invalid.token.here' },
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when the Authorization header is not a Bearer token', async () => {
    const request = {
      headers: { authorization: 'Basic sometokenhere' },
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should attach the user payload to the request when the token is valid', async () => {
    const payload = { userId: 1, username: 'testuser' };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
    const request = {
      headers: { authorization: 'Bearer valid.token.here' },
    };

    const result = await guard.canActivate(makeContext(request));

    expect(result).toBe(true);
    expect(request['user']).toEqual(payload);
  });
});