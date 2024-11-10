// src/common/common.module.ts

import { Module } from '@nestjs/common';
import { MemoryService } from './services/memory.service';

@Module({
  providers: [MemoryService],
  exports: [MemoryService],
})
export class CommonModule {}
