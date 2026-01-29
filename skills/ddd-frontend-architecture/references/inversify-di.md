# Inversify Dependency Injection

**APPLIES TO:** Multi-platform code, DI setup, service management

**THIS DOC DESCRIBES:** How to set up and use Inversify for dependency injection

## Setup

### Dependencies

```bash
npm install inversify reflect-metadata
npm install --save-dev @types/inversify
```

### TypeScript Config

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Bootstrap

```typescript
// platform-related/{platform}/bootstrap.ts
import 'reflect-metadata';
import { Container } from 'inversify';
import { SellerPCInfraContainerModule } from './infra';
import { CampaignApplicationServiceModule } from '@/core/application/campaign';

const container = new Container();

container.load(SellerPCInfraContainerModule);
container.load(CampaignApplicationServiceModule);

export { container };
```

## Service Definition

### Injectable Service

```typescript
// application/campaign/campaign.service.ts
import { inject, injectable } from 'inversify';
import type { CampaignAPI } from '@/core/infra/campaign-api.contract';
import type { ToastService } from '@/core/infra/toast-service.contract';
import { InfraModuleType } from '@/core/infra';
import type { ComCampaignEntity } from '@/domain/campaign/entity/com-campaign.entity';

@injectable()
export default class CampaignService {
  constructor(
    @inject(InfraModuleType.CampaignAPI)
    private api: CampaignAPI,
    @inject(InfraModuleType.ToastService)
    private toastService: ToastService,
  ) {}

  async listCampaigns() {
    const res = await this.api.list();
    return res.data.items.map(item => new ComCampaignEntity(item));
  }

  async register(campaignId: string) {
    const res = await this.api.register({ campaignId });
    if (res.code !== 0) {
      this.toastService.error(res.message);
    }
    return res;
  }
}
```

### Singleton vs Transient

```typescript
import { ContainerModule } from 'inversify';

// Singleton - same instance across all injections
bind(Service).to(ServiceImpl).inSingletonScope();

// Transient - new instance each time
bind(Service).to(ServiceImpl).inTransientScope();

// Request - one instance per request/operation
bind(Service).to(ServiceImpl).inRequestScope();
```

## ContainerModule Organization

### Infra Module

```typescript
// infra/index.ts
import { ContainerModule } from 'inversify';
import type { ToastService } from './toast-service.contract';
import type { I18nService } from './i18n-service.contract';
import type { TEAService } from './tea-service.contract';

export const InfraModuleType = {
  ToastService: Symbol.for('ToastService'),
  I18nService: Symbol.for('I18nService'),
  TEAService: Symbol.for('TEAService'),
};

export const InfraContainerModule = new ContainerModule(bind => {
  bind<ToastService>(InfraModuleType.ToastService)
    .to(ToastServiceImpl)
    .inSingletonScope();

  bind<I18nService>(InfraModuleType.I18nService)
    .to(I18nServiceImpl)
    .inSingletonScope();

  bind<TEAService>(InfraModuleType.TEAService)
    .to(TEAServiceImpl)
    .inSingletonScope();
});
```

### Application Service Module

```typescript
// application/campaign/index.ts
import { ContainerModule } from 'inversify';
import { CampaignService } from './campaign.service';
import { AgreementService } from './agreement.service';
import { ApplicationTypes } from './types';

export const CampaignApplicationServiceModule = new ContainerModule(bind => {
  bind(CampaignService).to(CampaignService).inSingletonScope();
  bind(AgreementService).to(AgreementService).inSingletonScope();
});
```

## Platform Implementation

### PC Platform

```typescript
// platform-related/seller-pc/infra/toast.service.ts
import { injectable } from 'inversify';
import { Message } from '@arco-design/web-react';
import type { ToastService } from '@/core/infra/toast-service.contract';

@injectable()
export default class ToastServicePC implements ToastService {
  success(message: string) {
    Message.success(message);
  }

  error(message: string) {
    Message.error(message);
  }

  info(message: string) {
    Message.info(message);
  }

  warning(message: string) {
    Message.warning(message);
  }
}

// platform-related/seller-pc/infra/index.ts
import { ContainerModule } from 'inversify';
import { InfraModuleType } from '@/core/infra';
import { ToastServicePC } from './toast.service';

export const SellerPCInfraContainerModule = new ContainerModule(bind => {
  bind(InfraModuleType.ToastService).to(ToastServicePC).inSingletonScope();
});
```

### Mobile/Lynx Platform

```typescript
// platform-related/seller-app/infra/toast.service.ts
import { injectable } from 'inversify';
import { nativeToast } from '@byted/mpa';
import type { ToastService } from '@/core/infra/toast-service.contract';

@injectable()
export default class ToastServiceMobile implements ToastService {
  success(message: string) {
    nativeToast.show({ type: 'success', message });
  }

  error(message: string) {
    nativeToast.show({ type: 'error', message });
  }
}
```

## Using Services

### In Application Services

```typescript
// application/campaign/campaign.service.ts
import { inject, injectable } from 'inversify';
import type { CampaignAPI } from '@/core/infra/campaign-api.contract';
import type { ToastService } from '@/core/infra/toast-service.contract';
import { InfraModuleType } from '@/core/infra';

@injectable()
export default class CampaignService {
  constructor(
    @inject(InfraModuleType.CampaignAPI)
    private api: CampaignAPI,
    @inject(InfraModuleType.ToastService)
    private toastService: ToastService,
  ) {}
}
```

### Direct Export for Stores

```typescript
// platform-related/seller-pc/export/services.ts
import { container } from '../bootstrap';
import type { CampaignAPI } from '@/core/infra/campaign-api.contract';
import type { ToastService } from '@/core/infra/toast-service.contract';
import { InfraModuleType } from '@/core/infra';

export const campaignAPI = container.get<CampaignAPI>(
  InfraModuleType.CampaignAPI,
);
export const toastService = container.get<ToastService>(
  InfraModuleType.ToastService,
);
```

## Testing with DI

### Mock Container

```typescript
// __tests__/campaign.service.test.ts
import { Container } from 'inversify';

// Create test container
const testContainer = new Container();

// Mock services
const mockToastService = { success: jest.fn(), error: jest.fn() };
const mockCampaignAPI = { list: jest.fn(), register: jest.fn() };

// Bind mocks
testContainer
  .bind(InfraModuleType.ToastService)
  .toConstantValue(mockToastService);
testContainer
  .bind(InfraModuleType.CampaignAPI)
  .toConstantValue(mockCampaignAPI);

// Get service under test
const campaignService = testContainer.get(CampaignService);
```

### Mock per Test

```typescript
describe('CampaignService', () => {
  let container: Container;
  let mockAPI: jest.Mocked<CampaignAPI>;
  let mockToast: jest.Mocked<ToastService>;

  beforeEach(() => {
    container = new Container();
    mockAPI = { list: jest.fn(), register: jest.fn() };
    mockToast = { success: jest.fn(), error: jest.fn() };

    container.bind(InfraModuleType.CampaignAPI).toConstantValue(mockAPI);
    container.bind(InfraModuleType.ToastService).toConstantValue(mockToast);
    container.bind(CampaignService).to(CampaignService);
  });

  it('should handle errors', async () => {
    mockAPI.list.mockRejectedValue(new Error('network error'));

    await expect(campaignService.listCampaigns()).rejects.toThrow();
  });
});
```

## Best Practices

| Practice                        | Reason             |
| ------------------------------- | ------------------ |
| Use interfaces in constructors  | Enables mocking    |
| Prefer singleton for services   | Stateless services |
| Use Symbol for identifiers      | Avoid string typos |
| Group modules logically         | Easier maintenance |
| Separate infra from application | Clear boundaries   |
