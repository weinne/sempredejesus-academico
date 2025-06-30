import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: any;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, user, ...renderOptions } = options;

  // Wrapper que incluirá providers necessários (React Query, Zustand, etc.)
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Será implementado quando os providers estiverem configurados
    return <>{children}</>;
  };

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

export const createMockRouter = (pathname: string = '/') => {
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