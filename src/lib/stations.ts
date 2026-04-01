// Délégations / Municipalités du gouvernorat de Gafsa (destinations)
export const DESTINATIONS = [
  "Gafsa Nord",
  "Gafsa Sud",
  "El Ksar",
  "Sidi Aïch",
  "Moulares",
  "Redeyef",
  "Metlaoui",
  "Mdhilla",
  "Belkhir",
  "Sened",
  "Zannouch",
  "El Guettar",
] as const;

export type Destination = (typeof DESTINATIONS)[number];

// Fixed departure point
export const DEPARTURE_POINT = "Yazaki" as const;
