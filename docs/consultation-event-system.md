# Consultation Event System - Technical Design Document

## Executive Summary

This document describes the architectural approach for decoupling consultation data refresh logic using an event-driven publish-subscribe pattern. The goal is to move data refetch responsibility from `ConsultationPad` to individual dashboard widgets (e.g., `ConditionsTable`, `AllergiesTable`), achieving better separation of concerns and scalability.

**Problem:** Currently, `ConsultationPad` manually calls `refreshQueries` for conditions after saving, creating tight coupling.

**Solution:** Implement an EventBus-based pub-sub pattern where `ConsultationPad` publishes a "consultation saved" event with metadata about what changed, and dashboard widgets selectively refetch their own data.

**Benefits:**

- ✅ Complete decoupling between ConsultationPad and widgets
- ✅ Scalable - easy to add new widgets without modifying ConsultationPad
- ✅ Selective refetch - only widgets with changed data refetch
- ✅ Type-safe event handling with TypeScript
- ✅ Testable - components can be tested independently

---

## 1. Current State Analysis

### Problem Description

**File:** `apps/clinical/src/components/consultationPad/ConsultationPad.tsx` (lines 267-270)

```typescript
// ❌ Current Implementation - Tight Coupling
if (selectedConditions.length > 0)
  await refreshQueries(queryClient, conditionsQueryKeys(patientUUID));
```

**Issues:**

1. **Incomplete Invalidation**: Only conditions get refreshed; allergies, medications, and investigations are ignored
2. **Tight Coupling**: ConsultationPad imports `conditionsQueryKeys` from `@bahmni/widgets`
3. **Not Scalable**: Adding new widgets (AllergiesTable, MedicationsTable) requires modifying ConsultationPad
4. **Violates Single Responsibility Principle**: ConsultationPad shouldn't know about widget internals
5. **Hard to Test**: Cannot test widgets' refetch behavior independently

### Current Flow

```
ConsultationPad
    │
    ├─ Saves consultation data
    │
    ├─ Directly calls refreshQueries(conditionsQueryKeys)
    │
    └─ ConditionsTable cache is invalidated
         (Other widgets ignored ❌)
```

---

## 2. Proposed Architecture

### Event-Driven Flow

```
ConsultationPad
    │
    ├─ Saves consultation data
    │
    ├─ Publishes "consultation:saved" event
    │   with metadata: { changedWidgets: { conditions: true, allergies: false, ... } }
    │
    └─ Event broadcast to all subscribers
          │
          ├─ ConditionsTable (listening)
          │   └─ Checks: changedWidgets.conditions === true? ✅ → refetch()
          │
          ├─ AllergiesTable (listening)
          │   └─ Checks: changedWidgets.allergies === false? ❌ → skip
          │
          ├─ MedicationsTable (listening)
          │   └─ Checks: changedWidgets.medications === true? ✅ → refetch()
          │
          └─ (Future widgets automatically work)
```

### Key Architectural Decisions

1. **Pub-Sub Pattern**: Publishers don't know about subscribers and vice versa
2. **Event Metadata**: Include which widgets changed to enable selective refetch
3. **EventBus Implementation**: Custom class-based EventBus for type safety and testability
4. **Widget Responsibility**: Each widget manages its own data lifecycle

---

## 3. Event Mechanism Comparison

We evaluated four different approaches before selecting EventBus:

### Option 1: Window CustomEvents

```typescript
window.dispatchEvent(new CustomEvent("event", { detail: data }));
window.addEventListener("event", handler);
```

**Pros:** ✅ Native browser API, ✅ Simple, ✅ Works across React trees  
**Cons:** ⚠️ Global scope pollution, ⚠️ Not React-idiomatic, ⚠️ Harder to test

### Option 2: EventEmitter Class ⭐ **SELECTED**

```typescript
class EventBus {
  private listeners = new Map<string, Set<Function>>();
  subscribe(event, callback) {
    /*...*/
  }
  publish(event, data) {
    /*...*/
  }
}
```

**Pros:** ✅ Full control, ✅ Type-safe, ✅ Easy to test, ✅ Namespace isolation  
**Cons:** ⚠️ More code to maintain, ⚠️ Need singleton management

### Option 3: React Context + useReducer

```typescript
const EventContext = createContext<EventContextType>(null);
export const useEventSubscription = (eventType, callback) => {
  /*...*/
};
```

**Pros:** ✅ Pure React way, ✅ Auto cleanup, ✅ DevTools support  
**Cons:** ⚠️ More boilerplate, ⚠️ Need Provider wrapping, ⚠️ **Challenging across packages**

**Cross-Package Considerations:**

- ❌ **Provider Placement Issue**: Would need to wrap entire app in `distro` (above both `apps/clinical` and `packages/bahmni-widgets`)
- ❌ **Multiple Apps Problem**: If widgets used in different apps, each needs Provider setup
- ❌ **Testing Complexity**: Every test needs Provider wrapper
- ⚠️ **Tight Coupling to React Tree**: Context only works within same React tree

### Option 4: TanStack Query Direct Invalidation

```typescript
queryClient.invalidateQueries({ predicate: (query) => {...} });
```

**Pros:** ✅ Using existing infrastructure, ✅ Direct  
**Cons:** ❌ Still couples ConsultationPad to query keys, ❌ Not truly decoupled

### Summary: Why EventEmitter Class Wins 🏆

| Feature              | Window CustomEvents        | EventEmitter Class             |
| -------------------- | -------------------------- | ------------------------------ |
| **Type Safety**      | ❌ Manual casting required | ✅ Full TypeScript inference   |
| **Namespace**        | ⚠️ Global scope pollution  | ✅ Completely isolated         |
| **Testing**          | ❌ Requires window mocks   | ✅ Easy spying & cleanup       |
| **Debugging**        | ❌ Hard to inspect         | ✅ Built-in introspection      |
| **Error Handling**   | ❌ Can break event chain   | ✅ Graceful, all listeners run |
| **API**              | ⚠️ Verbose & error-prone   | ✅ Clean & consistent          |
| **Extensibility**    | ❌ Limited                 | ✅ Easy to add features        |
| **Memory Safety**    | ⚠️ Easy to create leaks    | ✅ Clear cleanup patterns      |
| **Code to Maintain** | 0 lines                    | ~100 lines (one-time)          |

**Decision:** We chose **EventEmitter Class** because the ~100 lines of code is a one-time investment that provides:

- 🔒 **Safety**: Type-safe, namespace-isolated, memory-safe
- 🧪 **Testability**: Easy mocking, spying, cleanup
- 🐛 **Debuggability**: Introspection, centralized logging
- 🎨 **Developer Experience**: Clean API, auto-cleanup
- 📈 **Scalability**: Easy to extend with new features

This approach saves significant development time in debugging, testing, and maintenance throughout the project lifecycle.

### Why EventBus Works Better Across Packages

In our architecture:

```
bahmni-apps-frontend/
├── apps/clinical/                  # ConsultationPad lives here
│   └── src/components/consultationPad/
├── packages/bahmni-widgets/        # ConditionsTable lives here
│   └── src/conditions/
└── packages/bahmni-services/       # EventBus lives here
    └── src/events/
```

**React Context Challenges:**

1. **Provider Must Wrap Everything**:

   ```typescript
   // distro/src/main.tsx
   <EventProvider>  {/* ← Must be here, above everything */}
     <ClinicalApp>
       <ConsultationPad />  {/* publisher */}
     </ClinicalApp>
     <DashboardApp>
       <ConditionsTable />  {/* subscriber - different package! */}
     </DashboardApp>
   </EventProvider>
   ```

2. **Multiple Apps Problem**: If you have separate apps (clinical, registration, etc.), each needs the Provider
3. **Testing Nightmare**: Every test file needs Provider wrapper boilerplate

**EventBus Advantages:**

1. **No Provider Needed**:

   ```typescript
   // ConsultationPad.tsx
   import { eventBus } from "@bahmni/services";
   eventBus.publish("consultation:saved", data); // ✅ Just works

   // ConditionsTable.tsx (different package)
   import { eventBus } from "@bahmni/services";
   useEventSubscription("consultation:saved", handler); // ✅ Just works
   ```

2. **Works Across Any Boundary**: Packages, apps, lazy-loaded modules - doesn't matter
3. **Simple Testing**: No wrapper needed, just import and publish/subscribe
4. **Singleton Pattern**: One instance works everywhere

**Visual Comparison:**

```
React Context Approach (Complex):
┌─────────────────────────────────────────┐
│ EventProvider (in distro)               │
│  ├── Clinical App                       │
│  │   └── ConsultationPad (publish)      │
│  └── Widgets Package                    │
│      └── ConditionsTable (subscribe)    │
└─────────────────────────────────────────┘
       ↑ Must wrap everything!

EventBus Approach (Simple):
ConsultationPad → eventBus.publish()
                      ↓
                  (memory)
                      ↓
ConditionsTable ← eventBus.subscribe()
       ✅ No wrapping needed!
```

---

## 4. Event System Design

### EventBus Class Implementation

**File:** `packages/bahmni-services/src/events/EventBus.ts`

```typescript
import { useEffect } from "react";

// Event type definitions
export type EventType = "consultation:saved" | "consultation:cancelled";

// Event payload interface
export interface ConsultationSavedEventPayload {
  patientUUID: string;
  encounterUUID?: string;
  changedWidgets: {
    conditions: boolean;
    allergies: boolean;
    medications: boolean;
    investigations: boolean;
  };
  timestamp: number;
}

// Type mapping for event payloads
type EventPayload<T extends EventType> = T extends "consultation:saved"
  ? ConsultationSavedEventPayload
  : never;

/**
 * EventBus class for managing publish-subscribe pattern
 * Provides type-safe event handling across the application
 */
class EventBus {
  private listeners = new Map<EventType, Set<(payload: any) => void>>();

  /**
   * Subscribe to an event
   * @param event - The event type to subscribe to
   * @param callback - Function to call when event is published
   * @returns Unsubscribe function
   */
  subscribe<T extends EventType>(
    event: T,
    callback: (payload: EventPayload<T>) => void,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function for easy cleanup
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Publish an event to all subscribers
   * @param event - The event type to publish
   * @param payload - The event payload data
   */
  publish<T extends EventType>(event: T, payload: EventPayload<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Unsubscribe from an event
   * @param event - The event type to unsubscribe from
   * @param callback - The callback function to remove
   */
  private unsubscribe<T extends EventType>(
    event: T,
    callback: (payload: EventPayload<T>) => void,
  ): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Clear all listeners (useful for testing)
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get number of listeners for an event (useful for debugging)
   */
  getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * React hook for subscribing to events
 * Automatically handles cleanup on unmount
 *
 * @param event - The event type to subscribe to
 * @param callback - Function to call when event is published
 * @param deps - Dependencies array for useEffect
 */
export const useEventSubscription = <T extends EventType>(
  event: T,
  callback: (payload: EventPayload<T>) => void,
  deps: any[] = [],
) => {
  useEffect(() => {
    return eventBus.subscribe(event, callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
};
```

### Helper Functions

```typescript
/**
 * Convenience function to publish consultation saved event
 * @param payload - The consultation saved event data
 */
export const publishConsultationSaved = (
  payload: ConsultationSavedEventPayload,
): void => {
  eventBus.publish("consultation:saved", payload);
};
```

---

## 5. Implementation Details

### Step 1: Create EventBus in bahmni-services

**New File:** `packages/bahmni-services/src/events/EventBus.ts`

- Implement EventBus class (see Section 4)
- Export singleton instance
- Export useEventSubscription hook
- Export type definitions

### Step 2: Export from bahmni-services

**Update File:** `packages/bahmni-services/src/index.ts`

```typescript
// Add export
export {
  eventBus,
  useEventSubscription,
  publishConsultationSaved,
  type ConsultationSavedEventPayload,
  type EventType,
} from "./events/EventBus";
```

### Step 3: Update ConsultationPad (Publisher)

**Update File:** `apps/clinical/src/components/consultationPad/ConsultationPad.tsx`

**Remove:**

```typescript
import { refreshQueries } from "@bahmni/services";
import { conditionsQueryKeys } from "@bahmni/widgets";
```

**Add:**

```typescript
import { publishConsultationSaved } from "@bahmni/services";
```

**Replace (lines 267-270):**

```typescript
// ❌ OLD CODE - Remove this
if (selectedConditions.length > 0)
  await refreshQueries(queryClient, conditionsQueryKeys(patientUUID));

// ✅ NEW CODE - Add this
publishConsultationSaved({
  patientUUID: patientUUID!,
  encounterUUID: activeEncounter?.id,
  changedWidgets: {
    conditions: selectedConditions.length > 0,
    allergies: selectedAllergies.length > 0,
    medications: selectedMedications.length > 0,
    investigations: selectedServiceRequests.length > 0,
  },
  timestamp: Date.now(),
});
```

### Step 4: Update ConditionsTable (Subscriber)

**Update File:** `packages/bahmni-widgets/src/conditions/ConditionsTable.tsx`

**Add import:**

```typescript
import { useEventSubscription } from "@bahmni/services";
```

**Add subscription in component:**

```typescript
const ConditionsTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: conditionsQueryKeys(patientUUID!),
    enabled: !!patientUUID,
    queryFn: () => fetchConditions(patientUUID!),
  });

  // ✅ NEW CODE - Subscribe to consultation saved event
  useEventSubscription(
    "consultation:saved",
    (payload) => {
      // Only refetch if:
      // 1. Event is for the same patient
      // 2. Conditions were modified during consultation
      if (
        payload.patientUUID === patientUUID &&
        payload.changedWidgets.conditions
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  // ... rest of component
};
```

---

## 6. Code Examples

### Before (Current Implementation)

```typescript
// ConsultationPad.tsx - BEFORE
import { conditionsQueryKeys } from "@bahmni/widgets"; // ❌ Tight coupling

const handleOnPrimaryButtonClick = async () => {
  await submitConsultation();

  // ConsultationPad handles invalidation directly
  if (selectedConditions.length > 0) {
    await refreshQueries(queryClient, conditionsQueryKeys(patientUUID));
  }
  // Other widgets ignored ❌

  onClose();
};
```

### After (Event-Driven Implementation)

```typescript
// ConsultationPad.tsx - AFTER
import { publishConsultationSaved } from "@bahmni/services"; // ✅ No widget imports!

const handleOnPrimaryButtonClick = async () => {
  await submitConsultation();

  // Just publish event with metadata
  publishConsultationSaved({
    patientUUID: patientUUID!,
    encounterUUID: activeEncounter?.id,
    changedWidgets: {
      conditions: selectedConditions.length > 0,
      allergies: selectedAllergies.length > 0,
      medications: selectedMedications.length > 0,
      investigations: selectedServiceRequests.length > 0,
    },
    timestamp: Date.now(),
  });

  // That's it! ✅ Fully decoupled
  onClose();
};
```

```typescript
// ConditionsTable.tsx - AFTER
import { useEventSubscription } from '@bahmni/services';

const ConditionsTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { refetch } = useQuery({...});

  // Widget manages its own refetch
  useEventSubscription(
    'consultation:saved',
    (payload) => {
      if (payload.patientUUID === patientUUID && payload.changedWidgets.conditions) {
        refetch(); // ✅ Selective refetch
      }
    },
    [patientUUID, refetch]
  );

  return <SortableDataTable ... />;
};
```

---

## 7. Selective Refetch Logic

### Why Selective Refetch?

**Scenario:** User only adds an allergy during consultation

Without selective refetch:

- ❌ ConditionsTable refetches unnecessarily (no changes)
- ❌ AllergiesTable refetches (needed ✅)
- ❌ MedicationsTable refetches unnecessarily (no changes)
- **Result:** 3 API calls, only 1 needed

With selective refetch:

- ✅ ConditionsTable checks → changedWidgets.conditions === false → skips
- ✅ AllergiesTable checks → changedWidgets.allergies === true → refetches
- ✅ MedicationsTable checks → changedWidgets.medications === false → skips
- **Result:** 1 API call, exactly what's needed

### Implementation Pattern for All Widgets

```typescript
// Generic pattern for any widget
useEventSubscription(
  'consultation:saved',
  (payload) => {
    // Check 1: Same patient?
    if (payload.patientUUID !== currentPatientUUID) return;

    // Check 2: Was this widget's data modified?
    if (!payload.changedWidgets.{widgetType}) return;

    // Both checks passed → refetch
    refetch();
  },
  [currentPatientUUID, refetch]
);
```

---

## 8. Future Extensions

### Adding AllergiesTable

```typescript
// packages/bahmni-widgets/src/allergies/AllergiesTable.tsx

const AllergiesTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { refetch } = useQuery({...});

  // Same pattern as ConditionsTable
  useEventSubscription(
    'consultation:saved',
    (payload) => {
      if (payload.patientUUID === patientUUID && payload.changedWidgets.allergies) {
        refetch();
      }
    },
    [patientUUID, refetch]
  );

  return <AllergiesDataTable ... />;
};
```

### Adding MedicationsTable

```typescript
// Future widget following same pattern
useEventSubscription(
  "consultation:saved",
  (payload) => {
    if (
      payload.patientUUID === patientUUID &&
      payload.changedWidgets.medications
    ) {
      refetch();
    }
  },
  [patientUUID, refetch],
);
```

**Key Point:** ConsultationPad doesn't need any changes when adding new widgets! ✅

---

## 9. Testing Strategy

### Unit Tests for EventBus

**File:** `packages/bahmni-services/src/events/__tests__/EventBus.test.ts`

```typescript
import { eventBus, ConsultationSavedEventPayload } from "../EventBus";

describe("EventBus", () => {
  beforeEach(() => {
    eventBus.clear(); // Clean state before each test
  });

  it("should notify subscribers when event is published", () => {
    const callback = jest.fn();

    eventBus.subscribe("consultation:saved", callback);

    const payload: ConsultationSavedEventPayload = {
      patientUUID: "123",
      changedWidgets: {
        conditions: true,
        allergies: false,
        medications: false,
        investigations: false,
      },
      timestamp: Date.now(),
    };

    eventBus.publish("consultation:saved", payload);

    expect(callback).toHaveBeenCalledWith(payload);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should support multiple subscribers", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    eventBus.subscribe("consultation:saved", callback1);
    eventBus.subscribe("consultation:saved", callback2);

    const payload: ConsultationSavedEventPayload = {
      patientUUID: "123",
      changedWidgets: {
        conditions: true,
        allergies: false,
        medications: false,
        investigations: false,
      },
      timestamp: Date.now(),
    };

    eventBus.publish("consultation:saved", payload);

    expect(callback1).toHaveBeenCalledWith(payload);
    expect(callback2).toHaveBeenCalledWith(payload);
  });

  it("should unsubscribe correctly", () => {
    const callback = jest.fn();

    const unsubscribe = eventBus.subscribe("consultation:saved", callback);
    unsubscribe();

    eventBus.publish("consultation:saved", {} as any);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle errors in callbacks gracefully", () => {
    const errorCallback = jest.fn(() => {
      throw new Error("Test error");
    });
    const normalCallback = jest.fn();

    eventBus.subscribe("consultation:saved", errorCallback);
    eventBus.subscribe("consultation:saved", normalCallback);

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    eventBus.publish("consultation:saved", {} as any);

    expect(errorCallback).toHaveBeenCalled();
    expect(normalCallback).toHaveBeenCalled(); // Should still be called
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
```

### Integration Tests for ConditionsTable

```typescript
describe('ConditionsTable refetch on consultation save', () => {
  it('should refetch when conditions were modified', async () => {
    const { rerender } = render(<ConditionsTable />);

    // Simulate consultation save with conditions changed
    publishConsultationSaved({
      patientUUID: 'test-patient',
      changedWidgets: {
        conditions: true, // ✅ Changed
        allergies: false,
        medications: false,
        investigations: false,
      },
      timestamp: Date.now(),
    });

    // Assert: refetch was triggered
    await waitFor(() => {
      expect(screen.getByText('New Condition')).toBeInTheDocument();
    });
  });

  it('should NOT refetch when conditions were NOT modified', async () => {
    const refetchSpy = jest.fn();
    // Mock useQuery to spy on refetch

    render(<ConditionsTable />);

    // Simulate consultation save WITHOUT conditions changed
    publishConsultationSaved({
      patientUUID: 'test-patient',
      changedWidgets: {
        conditions: false, // ❌ Not changed
        allergies: true,
        medications: false,
        investigations: false,
      },
      timestamp: Date.now(),
    });

    // Assert: refetch was NOT called
    expect(refetchSpy).not.toHaveBeenCalled();
  });

  it('should NOT refetch for different patient', async () => {
    render(<ConditionsTable />); // patientUUID = 'patient-1'

    // Event for different patient
    publishConsultationSaved({
      patientUUID: 'patient-2', // Different patient!
      changedWidgets: {
        conditions: true,
        allergies: false,
        medications: false,
        investigations: false,
      },
      timestamp: Date.now(),
    });

    // Assert: refetch was NOT called (wrong patient)
  });
});
```

---

## 10. Benefits & Trade-offs

### Benefits

✅ **Complete Decoupling**

- ConsultationPad has zero knowledge of widgets
- Widgets don't know about ConsultationPad
- Changes to widgets don't affect ConsultationPad

✅ **Scalability**

- Adding new widgets requires NO changes to ConsultationPad
- Just add event subscription in new widget
- Pattern is consistent across all widgets

✅ **Selective Refetch**

- Only widgets with changed data refetch
- Reduces unnecessary API calls
- Better performance and user experience

✅ **Type Safety**

- Full TypeScript support
- Compile-time error checking
- IDE autocomplete for event payloads

✅ **Testability**

- EventBus can be tested in isolation
- Widgets can be tested with mock events
- Easy to verify refetch behavior

✅ **Maintainability**

- Clear separation of concerns
- Each widget manages its own data lifecycle
- Easier to debug and reason about

### Trade-offs

⚠️ **Slightly More Code**

- Need EventBus implementation
- Hook for subscription
- But this is reusable infrastructure

⚠️ **Learning Curve**

- Team needs to understand pub-sub pattern
- But pattern is well-documented and common

⚠️ **Indirect Communication**

- Events make flow less explicit
- But proper naming and types help
- Good documentation mitigates this

---

## 11. Files Modified Summary

### New Files

1. `packages/bahmni-services/src/events/EventBus.ts` - EventBus implementation
2. `packages/bahmni-services/src/events/__tests__/EventBus.test.ts` - Tests

### Modified Files

1. `packages/bahmni-services/src/index.ts` - Export event utilities
2. `apps/clinical/src/components/consultationPad/ConsultationPad.tsx` - Publish events
3. `packages/bahmni-widgets/src/conditions/ConditionsTable.tsx` - Subscribe and refetch

### Future Files (When extending pattern)

- `packages/bahmni-widgets/src/allergies/AllergiesTable.tsx`
- `packages/bahmni-widgets/src/medications/MedicationsTable.tsx`
- `packages/bahmni-widgets/src/investigations/InvestigationsTable.tsx`

---

## 12. Migration Checklist

- [ ] Create EventBus class in `packages/bahmni-services/src/events/EventBus.ts`
- [ ] Add EventBus tests in `packages/bahmni-services/src/events/__tests__/EventBus.test.ts`
- [ ] Export event utilities from `packages/bahmni-services/src/index.ts`
- [ ] Update ConsultationPad to publish events instead of calling refreshQueries
- [ ] Remove conditionsQueryKeys import from ConsultationPad
- [ ] Update ConditionsTable to subscribe to events and handle refetch
- [ ] Test ConditionsTable refetch behavior
- [ ] Verify no regressions in consultation save flow
- [ ] Document pattern for team (this document!)
- [ ] Apply same pattern to AllergiesTable (future)
- [ ] Apply same pattern to MedicationsTable (future)
- [ ] Apply same pattern to InvestigationsTable (future)

---

## Conclusion

This event-driven architecture provides a robust, scalable solution for decoupling consultation data refresh logic. By moving refetch responsibility to individual widgets and using selective refetch based on event metadata, we achieve:

1. Better separation of concerns
2. Improved scalability
3. Reduced API calls
4. Type-safe event handling
5. Easier testing and maintenance

The pattern is consistent, well-documented, and can be easily extended to other widgets in the future.

---

**Document Version:** 1.0  
**Last Updated:** December 18, 2025  
**Authors:** Development Team  
**Related Jira:** BAH-4325
