export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function diffInDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

// duplicate of createAppointmentServiceViewModels from allServices/utils.ts
export function buildServiceViewModels(
  services: {
    uuid: string;
    name: string;
    location?: { name: string };
    speciality?: { name: string };
    durationMins?: number;
    description?: string;
    attributes?: { attributeType: string; value: string }[];
  }[],
  attributeNames: string[],
) {
  return services.map((service) => ({
    id: service.uuid,
    name: service.name,
    location: service.location?.name ?? null,
    speciality: service.speciality?.name ?? null,
    durationMins: service.durationMins,
    description: service.description,
    attributes: Object.fromEntries(
      attributeNames.map((name) => [
        name,
        service.attributes?.find((a) => a.attributeType === name)?.value ??
          null,
      ]),
    ),
  }));
}
