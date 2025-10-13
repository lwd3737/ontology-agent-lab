interface OntologyPrismaMapping {
  [objectType: string]: {
    model: string;
    fields: {
      [propertyId: string]: ModelField;
    };
  };
}

type ModelField = string;

export const OntologyPrismaMapping: OntologyPrismaMapping = {};
