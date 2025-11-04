import type {
  PrismaFieldsMappingDefinition,
  PrismaSchemaMappingDefinition,
} from "./schema-mapping-definition";

export default class PrismaSchemaMapper {
  constructor(
    private readonly schemaMappingDefinition: PrismaSchemaMappingDefinition
  ) {}

  public getPrismaModel(objectType: string): string {
    const { model } = this.schemaMappingDefinition[objectType];
    if (!model) {
      throw new Error(`No model found for object type: ${objectType}`);
    }
    return model;
  }

  public getPrismaField(
    objectType: string,
    propertyId: string
  ): PrismaFieldsMappingDefinition[string] {
    const { fields } = this.schemaMappingDefinition[objectType];
    if (!fields) {
      throw new Error(`No fields found for object type: ${objectType}`);
    }
    const field = fields[propertyId];
    if (!field) {
      throw new Error(`No name found for property id: ${propertyId}`);
    }
    return field;
  }
}
