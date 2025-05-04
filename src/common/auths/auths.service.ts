import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';
import { UnauthorizedException } from '../exception/types/unauthorized.exception';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginDefaultDto } from './dto/login-default.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class AuthsService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private userService: UserService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginDefaultDto: LoginDefaultDto) {
    let currentUser: User | null = null;
    try {
      currentUser = await this.userService.findOneBy({
        where: {
          username: loginDefaultDto.username || '',
        },
      });
    } catch (err) {}
    if (!currentUser) {
      throw new UnauthorizedException(
        'invalidCredential',
        'Your credential is invalid.',
      );
    }
    const isMatch = await bcrypt.compare(
      loginDefaultDto.password,
      currentUser.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException(
        'invalidCredential',
        'Your credential is invalid.',
      );
    }
    return currentUser;
  }

  async generateRefreshToken(payload: any) {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRED'),
      secret: this.configService.get('JWT_SECRET_REFRESH'),
    });
  }

  async login(user: Partial<User>) {
    const payload: TokenPayload = {
      id: user.id || 0,
      username: user.username || '',
      isAdmin: user.isAdmin || false,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = await this.generateRefreshToken(payload);

    const accessTokenKeyCache = `accessToken_${user.id}`;
    await this.cacheManager.set(
      accessTokenKeyCache,
      accessToken,
      60 * 60 * 60 * 24 * 7,
    );

    const refreshTokenKeyCache = `refreshToken_${user.id}`;
    await this.cacheManager.set(
      refreshTokenKeyCache,
      refreshToken,
      60 * 60 * 60 * 24 * 7,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.refreshToken || '';

    const payload: TokenPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get('JWT_SECRET_REFRESH'),
    });

    if (payload.id === null) {
      throw new UnauthorizedException(
        'invalidToken',
        'Token payload is invalid.',
      );
    }
    const user = await this.userService.findOne(payload.id);

    return await this.login(user ? user : {});
  }

  async validateToken(accessToken: string) {
    return this.jwtService.verify(accessToken, {
      secret: this.configService.get('JWT_SECRET_ACCESS'),
      ignoreExpiration: false,
    });
  }

  async getMe(id: number) {
    const currentUser = await this.userService.findOneBy({
      where: {
        id,
      },
    });

    if (!currentUser) {
      throw new UnauthorizedException(
        'invalidCredential',
        'Your credential is invalid.',
      );
    }

    return currentUser;
  }
}
