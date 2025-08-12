export const roles = ["user-editor", "project-editor", "infrastructure-admin"] as const;

export const metadataTypes = [
  {
    name: "cost",
    dataType: "int",
    translations: [
      {
        language: "en",
        displayName: "Cost",
        description: "Cost of the project rounded to the nearest euro",
        unit: "EUR",
      },
      {
        language: "de",
        displayName: "Kosten",
        description: "Kosten des Projekts auf die nächste Euro gerundet",
        unit: "EUR",
      },
    ],
  },
  {
    name: "time_invested",
    dataType: "float",
    translations: [
      {
        language: "en",
        displayName: "Time Invested",
        description: "Time invested in the project in hours",
        unit: "hours",
      },
      {
        language: "de",
        displayName: "Zeitaufwand",
        description: "Zeitaufwand für das Projekt in Stunden",
        unit: "Stunden",
      },
    ],
  },
] as const;
