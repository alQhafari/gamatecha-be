import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseSuccessResponse } from '../response/base.response';
import {
  CreateSwaggerExample,
  DetailSwaggerExample,
} from '../swagger/swagger-example.response';
import { ResponseUserDto } from '../user/dto/response-user.dto';
import { AuthsService } from './auths.service';
import { LoginDefaultDto } from './dto/login-default.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) {}

  // @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login')
  @CreateSwaggerExample(LoginDefaultDto, LoginResponseDto, false, 'Login')
  async loginDefault(
    @Body() loginDefaultDto: LoginDefaultDto,
  ): Promise<BaseSuccessResponse<LoginResponseDto>> {
    const currentUser = await this.authsService.validateUser(loginDefaultDto);
    const result = await this.authsService.login(currentUser);
    return {
      data: plainToInstance(LoginResponseDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  // @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('refresh')
  @CreateSwaggerExample(LoginResponseDto, LoginResponseDto, false, 'Refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<BaseSuccessResponse<LoginResponseDto>> {
    const result = await this.authsService.refreshToken(refreshTokenDto);
    return {
      data: plainToInstance(LoginResponseDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  // @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Get('validate')
  @DetailSwaggerExample(TokenResponseDto)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async validateToken(
    @Request() req: any,
  ): Promise<BaseSuccessResponse<TokenResponseDto>> {
    const accessToken = req.headers.authorization;
    const result = await this.authsService.validateToken(
      accessToken.split(' ')[1],
    );
    return {
      data: plainToInstance(TokenResponseDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('me')
  @DetailSwaggerExample(ResponseUserDto)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMe(
    @Request() req: any,
  ): Promise<BaseSuccessResponse<ResponseUserDto>> {
    const user = await this.authsService.getMe(req.user.id);
    return {
      data: plainToInstance(ResponseUserDto, user, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
