# API Optimization: Using _include Parameter

## Overview

This document explains how to use the `_include=MedicationRequest:medication` parameter to optimize API calls and avoid redundant requests to fetch related medication details.

## Problem Statement

Previously, when fetching medication requests:
1. Initial API call: `GET /MedicationRequest?patient=XXX`
   - Returns medication requests with `medicationReference` (only a reference ID, not full details)
2. Secondary API calls: `GET /Medication/{medicationId}` (for each medication)
   - Required if you need full medication details (name, form, dosage, etc.)

**Result**: N+1 API call problem - 1 initial + N additional calls for N medications

## Solution: Using _include Parameter

With `_include=MedicationRequest:medication`, the API includes the related Medication resource in the response:

```
GET /MedicationRequest?patient=XXX&_include=MedicationRequest:medication
```

**Result**: Single API call that returns both MedicationRequest and related Medication resources

## Trade-offs

| Aspect | Without _include | With _include |
|--------|------------------|---------------|
| API Calls | Multiple (1 + N) | Single |
| Payload Size | Smaller | Larger (~2-5x) |
| Latency | Multiple requests | Single request |
| Use Case | Basic info only | Full details needed |

## Implementation

### Constants (medicationRequestService/constants.ts)

```typescript
export const MEDICATION_REQUEST_QUERY_PARAMS = {
  SORT: '_sort=-_lastUpdated',
  COUNT: '_count=100',
  INCLUDE_MEDICATION: '_include=MedicationRequest:medication',
};

export const PATIENT_MEDICATION_RESOURCE_URL_WITH_INCLUDE = (
  patientUUID: string,
  code?: string,
  encounterUuids?: string,
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 + '/MedicationRequest?' +
    MEDICATION_REQUEST_QUERY_PARAMS.SORT + '&' +
    MEDICATION_REQUEST_QUERY_PARAMS.COUNT + '&' +
    MEDICATION_REQUEST_QUERY_PARAMS.INCLUDE_MEDICATION;
  // ... rest of implementation
};
```

### Service Functions (medicationRequestService.ts)

Both functions now accept an optional `includeRelated` parameter:

```typescript
export async function getPatientMedicationBundle(
  patientUUID: string,
  code?: string[],
  encounterUuids?: string[],
  includeRelated: boolean = false,  // NEW PARAMETER
): Promise<Bundle> { ... }

export async function getPatientMedications(
  patientUUID: string,
  code?: string[],
  encounterUuids?: string[],
  includeRelated: boolean = false,  // NEW PARAMETER
): Promise<MedicationRequest[]> { ... }
```

## Usage Examples

### Default: Without _include (Recommended for most cases)

```typescript
// In your component
const { data: existingMedications } = useQuery({
  queryKey: ['medications', patientUUID],
  queryFn: () => getPatientMedications(
    patientUUID!,
    [],
    undefined
    // includeRelated defaults to false
  ),
});
```

**When to use**:
- Just displaying medication lists
- Basic duplicate detection (checking by name only)
- Performance-critical sections

### With _include (For when you need complete details)

```typescript
// In your component when full medication details are needed
const { data: medicationsWithDetails } = useQuery({
  queryKey: ['medicationsWithDetails', patientUUID],
  queryFn: () => getPatientMedications(
    patientUUID!,
    [],
    undefined,
    true  // includeRelated = true, includes medication resource
  ),
});
```

**When to use**:
- Displaying full medication details (form, strength, etc.)
- Need to avoid additional medication lookup calls
- User is actively viewing/editing a single medication
- The medication details are critical to the immediate user workflow

## Caching Strategy

Since fetching with `_include` creates a larger payload, implement proper cache management:

```typescript
// Cache 2 separate queries with different keys
const medicationsQuery = useQuery({
  queryKey: ['medications', patientUUID], // Basic medications
  queryFn: () => getPatientMedications(patientUUID),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

const medicationsDetailedQuery = useQuery({
  queryKey: ['medicationsDetailed', patientUUID], // With full details
  queryFn: () => getPatientMedications(patientUUID, [], undefined, true),
  staleTime: 10 * 60 * 1000, // 10 minutes (less frequent updates)
  enabled: needsDetailedMedications, // Only fetch when needed
});
```

## Best Practices

1. **Don't always use _include**
   - Only use when you need medication details immediately
   - Start with the default (includeRelated: false)

2. **Monitor payload size**
   - Use browser DevTools to check payload sizes
   - If >500KB, consider pagination or filtering

3. **Combine with other optimizations**
   - Filter by `code` to get specific medications only
   - Filter by `encounterUuids` if searching in consultation context

4. **Cache appropriately**
   - Separate query keys for different API calls
   - Use different stale times based on usage patterns

## Migration Guide

If you're currently making separate API calls for medication details:

**Before:**
```typescript
const medications = await getPatientMedications(patientUUID);
const medicationDetails = await Promise.all(
  medications.map(med => getMedicationById(med.id))
);
```

**After:**
```typescript
const medications = await getPatientMedications(
  patientUUID,
  [],
  undefined,
  true  // Single call with all details
);
```

## Troubleshooting

### Payload too large?
- Use without `_include` and fetch details lazily on demand
- Implement pagination with `_count` parameter
- Filter by specific medication codes

### Not getting medication details?
- Ensure `includeRelated: true` is passed
- Check that `_include=MedicationRequest:medication` is in the URL
- Verify the server supports FHIR `_include` parameter

### Performance degradation?
- Monitor network payload in DevTools
- Consider fetching details on-demand for individual medications
- Use separate cache keys for different query patterns
