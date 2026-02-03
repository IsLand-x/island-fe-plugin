# Platform Abstraction

**APPLIES TO:** Multi-platform code sharing, cross-platform development

**THIS DOC DESCRIBES:** How to abstract platform differences for code reuse

## Core Concept

```
┌─────────────────────────────────────────────┐
│  Core Business Logic (Domain + Application) │  ← Shared across platforms
├─────────────────────────────────────────────┤
│  Contracts / Interfaces                      │  ← Platform-agnostic
├─────────────────────────────────────────────┤
│  Platform Implementations (PC / Mobile)      │  ← Platform-specific
└─────────────────────────────────────────────┘
```

## Infrastructure Contracts

### Toast Service

```typescript
// core/infra/toast-service.contract.ts
export interface ToastService {
  info(msg: string): void;
  error(msg: string): void;
  success(msg: string): void;
  warning(msg: string): void;
}

export const InfraModuleType = {
  ToastService: Symbol.for('ToastService'),
  // ... other services
};
```

### I18n Service

```typescript
// core/infra/i18n-service.contract.ts
export interface I18nService {
  t(key: string, params?: Record<string, unknown>): string;
  locale: string;
}

export const InfraModuleType = {
  I18nService: Symbol.for('I18nService'),
};
```

### TEA (Analytics) Service

```typescript
// core/infra/tea-service.contract.ts
export interface TEAService {
  sendPV(params: Record<string, unknown>): void;
  sendEvent(name: string, params: Record<string, unknown>): void;
}

export const InfraModuleType = {
  TEAService: Symbol.for('TEAService'),
};
```

### API Client

```typescript
// core/infra/api-client.contract.ts
export interface APIClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(url: string, data: unknown): Promise<T>;
  put<T>(url: string, data: unknown): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

export const InfraModuleType = {
  APIClient: Symbol.for('APIClient'),
};
```

## Domain Contracts

### UI Service Contract

```typescript
// domain/campaign/contract/ui-service.contract.ts
export interface CampaignUIService {
  showServiceFeeModal(params: ServiceFeeModalParams): Promise<{ isAccepted: boolean }>;
  showAgreementModal(params: AgreementModalParams): Promise<void>;
  showProductDrawer(params: ProductDrawerParams): void;
  showCampaignDetail(campaignId: string): void;
}

export const CampaignDomainService = {
  CampaignUIService: Symbol.for('CampaignUIService'),
};
```

### Navigation Contract

```typescript
// domain/navigation/navigation.contract.ts
export interface NavigationService {
  navigateTo(path: string, params?: Record<string, unknown>): void;
  goBack(): void;
  openInNewTab(url: string): void;
}

export const NavigationModuleType = {
  NavigationService: Symbol.for('NavigationService'),
};
```

## Platform Implementations

### PC Platform

```typescript
// platform-related/seller-pc/infra/toast.service.ts
import { injectable } from 'inversify';
import { Message } from '@arco-design/web-react';
import type { ToastService } from '@/core/infra/toast-service.contract';

@injectable()
export default class ToastServicePC implements ToastService {
  success(message: string) {
    Message.success({ content: message, duration: 2000 });
  }

  error(message: string) {
    Message.error({ content: message, duration: 0 });
  }

  info(message: string) {
    Message.info({ content: message, duration: 2000 });
  }

  warning(message: string) {
    Message.warning({ content: message, duration: 2000 });
  }
}

// platform-related/seller-pc/infra/i18n.service.ts
import { injectable } from 'inversify';
import { useLocale } from '@i18n/react';
import type { I18nService } from '@/core/infra/i18n-service.contract';

@injectable()
export default class I18nServicePC implements I18nService {
  get locale() {
    return useLocale();
  }

  t(key: string, params?: Record<string, unknown>) {
    // PC i18n implementation
    return translate(key, params);
  }
}

// platform-related/seller-pc/infra/tea.service.ts
import { injectable } from 'inversify';
import tea from '@tea/js';
import type { TEAService } from '@/core/infra/tea-service.contract';

@injectable()
export default class TEAServicePC implements TEAService {
  sendPV(params: Record<string, unknown>) {
    tea.sendPage(params);
  }

  sendEvent(name: string, params: Record<string, unknown>) {
    tea.sendEvent(name, params);
  }
}
```

### Mobile Platform

```typescript
// platform-related/seller-app/infra/toast.service.ts
import { injectable } from 'inversify';
import { nativeToast } from '@byted/mpa';
import type { ToastService } from '@/core/infra/toast-service.contract';

@injectable()
export default class ToastServiceMobile implements ToastService {
  success(message: string) {
    nativeToast.show({ type: 'success', message, duration: 2000 });
  }

  error(message: string) {
    nativeToast.show({ type: 'error', message, duration: 0 });
  }

  info(message: string) {
    nativeToast.show({ type: 'info', message, duration: 2000 });
  }

  warning(message: string) {
    nativeToast.show({ type: 'warning', message, duration: 2000 });
  }
}

// platform-related/seller-app/infra/tea.service.ts
import { injectable } from 'inversify';
import { measure, event } from '@tea/mini';
import type { TEAService } from '@/core/infra/tea-service.contract';

@injectable()
export default class TEAServiceMobile implements TEAService {
  sendPV(params: Record<string, unknown>) {
    measure('page_view', params);
  }

  sendEvent(name: string, params: Record<string, unknown>) {
    event(name, params);
  }
}
```

### Lynx Platform

```typescript
// platform-related/seller-lynx/infra/toast.service.ts
import { injectable } from 'inversify';
import { lynxToast } from '@byted/lynx';
import type { ToastService } from '@/core/infra/toast-service.contract';

@injectable()
export default class ToastServiceLynx implements ToastService {
  success(message: string) {
    lynxToast.success(message);
  }

  error(message: string) {
    lynxToast.error(message);
  }
}
```

## Container Setup

### PC Container

```typescript
// platform-related/seller-pc/bootstrap.ts
import 'reflect-metadata';
import { Container } from 'inversify';
import { SellerPCInfraContainerModule } from './infra';
import { CampaignApplicationServiceModule } from '@/core/application/campaign';

const container = new Container();

container.load(SellerPCInfraContainerModule);
container.load(CampaignApplicationServiceModule);

export { container };

// Export for stores
export const toastService = container.get<ToastService>(InfraModuleType.ToastService);
export const i18nService = container.get<I18nService>(InfraModuleType.I18nService);
export const teaService = container.get<TEAService>(InfraModuleType.TEAService);
```

### Mobile Container

```typescript
// platform-related/seller-app/bootstrap.ts
import 'reflect-metadata';
import { Container } from 'inversify';
import { SellerAppInfraContainerModule } from './infra';
import { CampaignApplicationServiceModule } from '@/core/application/campaign';

const container = new Container();

container.load(SellerAppInfraContainerModule);
container.load(CampaignApplicationServiceModule);

export { container };
```

## Usage in Business Logic

```typescript
// application/campaign/campaign.service.ts
import { inject, injectable } from 'inversify';
import type { ToastService } from '@/core/infra/toast-service.contract';
import type { TEAService } from '@/core/infra/tea-service.contract';
import { InfraModuleType } from '@/core/infra';

@injectable()
export default class CampaignService {
  constructor(
    @inject(InfraModuleType.ToastService)
    private toastService: ToastService,
    @inject(InfraModuleType.TEAService)
    private teaService: TEAService,
  ) {}

  async register(campaignId: string) {
    this.teaService.sendEvent('campaign_register_start', { campaignId });

    try {
      const res = await this.api.register({ campaignId });

      if (res.code === 0) {
        this.toastService.success('报名成功');
        this.teaService.sendEvent('campaign_register_success', { campaignId });
      } else {
        this.toastService.error(res.message);
      }

      return res;
    } catch (error) {
      this.toastService.error('报名失败，请重试');
      this.teaService.sendEvent('campaign_register_error', { campaignId });
      throw error;
    }
  }
}
```

## Testing Without Platform

```typescript
// __tests__/campaign.service.test.ts
import { Container } from 'inversify';

// Mock platform services
const mockToastService = {
  success: jest.fn(),
  error: jest.fn(),
};

const mockTEAService = {
  sendEvent: jest.fn(),
};

const container = new Container();
container.bind(InfraModuleType.ToastService).toConstantValue(mockToastService);
container.bind(InfraModuleType.TEAService).toConstantValue(mockTEAService);

// Test business logic without platform dependencies
it('should handle registration flow', async () => {
  const service = container.get(CampaignService);
  await service.register('123');

  expect(mockToastService.success).toHaveBeenCalled();
  expect(mockTEAService.sendEvent).toHaveBeenCalledWith(
    'campaign_register_success',
    expect.any(Object),
  );
});
```

## What to Abstract

| Category | Should Abstract | Keep Platform-Specific |
|----------|-----------------|------------------------|
| Toast | Interface + basic methods | Animation, duration |
| I18n | Interface + t() | Translation content |
| Analytics | Interface + events | Tracking implementation |
| Navigation | Interface + methods | Transition effects |
| API | Interface + methods | Interceptors, retry logic |
| UI Components | - | Everything (not abstractable) |
| Business Logic | Everything | - |
