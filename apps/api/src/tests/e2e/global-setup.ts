import type { FullConfig } from '@playwright/test';

export default async function globalSetup(_config: FullConfig) {
  // No-op: servers are managed externally (reuseExistingServer=true)
}


