import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListNotificationsQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit: number = 20;
  /** Tối đa 100 trang → OFFSET tối đa 99 * 50 = 4950, DB không phải quét quá sâu */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) page: number = 1;
}