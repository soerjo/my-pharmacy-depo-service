import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // async validateUser(email: string, password: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email },
  //   });

  //   if (!user || !user.isActive) {
  //     return null;
  //   }

  //   const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  //   if (!isPasswordValid) {
  //     return null;
  //   }

  //   const { passwordHash, ...result } = user;
  //   return result;
  // }

  // async login(loginDto: LoginDto) {
  //   const user = await this.validateUser(loginDto.email, loginDto.password);

  //   if (!user) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }

  //   const tokens = await this.generateTokens(user.id, user.email);

  //   return {
  //     user: {
  //       id: user.id,
  //       email: user.email,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //     },
  //     ...tokens,
  //   };
  // }

  // async register(registerDto: RegisterDto) {
  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { email: registerDto.email },
  //   });

  //   if (existingUser) {
  //     throw new ConflictException('Email already registered');
  //   }

  //   const passwordHash = await bcrypt.hash(registerDto.password, 10);

  //   const user = await this.prisma.user.create({
  //     data: {
  //       email: registerDto.email,
  //       passwordHash,
  //       firstName: registerDto.firstName,
  //       lastName: registerDto.lastName,
  //     },
  //     select: {
  //       id: true,
  //       email: true,
  //       firstName: true,
  //       lastName: true,
  //       isActive: true,
  //     },
  //   });

  //   const tokens = await this.generateTokens(user.id, user.email);

  //   return {
  //     user,
  //     ...tokens,
  //   };
  // }

  // async generateTokens(userId: string, email: string) {
  //   const payload = { sub: userId, email };

  //   const [accessToken, refreshToken] = await Promise.all([
  //     this.jwtService.signAsync(payload, {
  //       secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
  //       expiresIn: this.configService.get<string>(
  //         'JWT_ACCESS_EXPIRATION',
  //         '15m',
  //       ) as any,
  //     }),
  //     this.jwtService.signAsync(payload, {
  //       secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
  //       expiresIn: this.configService.get<string>(
  //         'JWT_REFRESH_EXPIRATION',
  //         '7d',
  //       ) as any,
  //     }),
  //   ]);

  //   return {
  //     accessToken,
  //     refreshToken,
  //   };
  // }

  // async refreshToken(refreshToken: string) {
  //   try {
  //     const payload = await this.jwtService.verifyAsync(refreshToken, {
  //       secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
  //     });

  //     const user = await this.prisma.user.findUnique({
  //       where: { id: payload.sub, isActive: true },
  //       select: {
  //         id: true,
  //         email: true,
  //         firstName: true,
  //         lastName: true,
  //       },
  //     });

  //     if (!user) {
  //       throw new UnauthorizedException();
  //     }

  //     const tokens = await this.generateTokens(user.id, user.email);

  //     return {
  //       user,
  //       ...tokens,
  //     };
  //   } catch {
  //     throw new UnauthorizedException('Invalid refresh token');
  //   }
  // }
}
