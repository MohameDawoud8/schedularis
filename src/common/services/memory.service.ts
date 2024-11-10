import { Injectable, Logger } from '@nestjs/common';
import * as v8 from 'v8';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly heapSizeThreshold = 200 * 1024 * 1024; // 200MB

  async optimizeMemory() {
    if (this.shouldCollectGarbage()) {
      this.logger.log('Triggering garbage collection');
      if (global.gc) {
        global.gc();
      } else {
        this.logger.warn(
          `Garbage collection is not exposed. Run with --expose-gc flag.`,
        );
      }
    }
  }

  private shouldCollectGarbage(): boolean {
    const stats = v8.getHeapStatistics();
    return stats.used_heap_size > this.heapSizeThreshold;
  }
}
