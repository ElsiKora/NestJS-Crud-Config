
# ConfigData Event System

This document describes the TypeORM event system implementation for the ConfigData entity in the configdataevents module.

## Overview

The event system uses TypeORM subscribers to capture entity lifecycle events and transforms them into NestJS events using the EventEmitter2. This allows for a clean separation of concerns and makes it easy to react to entity changes throughout the application.

## Directory Structure

```
module/
├── entity/
│   └── configdata.entity.ts
├── event/
│   └── beforeInsert.event.ts
├── listener/
│   └── beforeInsert.listener.ts
├── subscriber/
│   └── beforeInsert.subscriber.ts
├── configdata.controller.ts
├── configdata.service.ts
└── configdataevents.module.ts
```

## Events

### BeforeInsert

- **Event Class**: `ConfigDataEventBeforeInsert`
- **Subscriber**: `ConfigDataBeforeInsertSubscriber`
- **Listener**: `ConfigDataBeforeInsertListener`
- **Event Name**: `configdataevents.beforeInsert`
- **Description**: Triggered before a new ConfigData entity is inserted into the database. Use for validation, data normalization, or setting default values.

## How It Works

1. **Subscribers** implement the TypeORM EntitySubscriberInterface and listen for specific entity lifecycle events
2. When an event occurs, the subscriber creates an **Event** object with the entity and context
3. The subscriber emits this event using EventEmitter2
4. **Listeners** with the @OnEvent decorator receive the event and process it
5. Listeners return a result indicating success or failure
6. The subscriber collects all listener results and determines if the operation should proceed

## Usage Example

Here's how you can add custom logic to ConfigData events:

```typescript
// In ConfigDataBeforeInsertListener
@OnEvent("configdataevents.beforeInsert")
async handleBeforeInsert(payload: ConfigDataEventBeforeInsert): Promise<{ isSuccess: boolean; error?: unknown }> {
  try {
    const entity = payload.item;
    
    // Your custom logic here, for example:
    if (entity.someProperty === 'invalid') {
      throw new BadRequestException('Invalid someProperty value');
    }
    
    // Perhaps update a related entity
    await payload.eventManager.getRepository(RelatedEntity).save({
      configdataId: entity.id,
      updatedAt: new Date()
    });
    
    return { isSuccess: true };
  } catch (error) {
    return { isSuccess: false, error };
  }
}
```

## Best Practices

1. Keep listeners focused on a single responsibility
2. Use dependency injection to access services
3. Return detailed error information for troubleshooting
4. Use the EventEmitter for cross-module communication
5. Store listeners in the 'listener' directory and name them '*.listener.ts'
6. Store subscribers in the 'subscriber' directory and name them '*.subscriber.ts'
7. Store event classes in the 'event' directory and name them '*.event.ts'
8. Add appropriate error handling to prevent crashes
9. Return appropriate HTTP exceptions when needed

## Performance Considerations

- Event emitters add some overhead, so use them judiciously
- For high-volume operations, consider optimizing or bypassing the event system
- Set `verboseMemoryLeak: false` in production for better performance
