import { SetMetadata } from '@nestjs/common';

export const MEMORY_MANAGED = 'memory_managed';

export function MemoryManaged() {
  return SetMetadata(MEMORY_MANAGED, true);
}
