import { vi } from 'vitest';

// Component helpers will be implemented when React is properly configured
export const renderWithProviders = (): any => {
  console.warn('renderWithProviders: React not configured in shared-tests package');
  return null;
};

export const createMockRouter = (pathname: string = '/'): any => {
  return {
    pathname,
    route: pathname,
    query: {},
    asPath: pathname,
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };
};

export const waitForApiCall = async (apiCallPromise: Promise<any>) => {
  try {
    const result = await apiCallPromise;
    return result;
  } catch (error) {
    throw error;
  }
};

export const mockApiResponse = (data: any, status: number = 200) => {
  return Promise.resolve({
    status,
    data,
    headers: {},
    config: {},
    statusText: 'OK',
  });
}; 