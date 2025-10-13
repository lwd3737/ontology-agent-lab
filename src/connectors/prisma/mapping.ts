interface OntologyPrismaMapping {
	[objectType: string]: {
		model: string;
		propertyMapping: {
			[property: string]: ModelField;
		};
	};
}

type ModelField = string;

export const OntologyPrismaMapping = {};
