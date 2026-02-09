import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryUserDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  gender?: string;
}
