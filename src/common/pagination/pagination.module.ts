import { Module, Global } from '@nestjs/common';
import { PaginationService } from './pagination.service';

@Global() // Make it available everywhere without importing
@Module({
  providers: [PaginationService],
  exports: [PaginationService],
})
export class PaginationModule {}
