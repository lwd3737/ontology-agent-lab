const OBJECT_INSTANCE_FORMAT_CONTEXT = `
# Object Instance Format
- rid: This represents the unique resource ID for the object instance, which is the value of the primary key property.
- objectType: This is the ontology object type ID that the object instance belongs to.
- properties: Object properties mapped by propertyId. Each propertyId corresponds to an ontology property.
`.trim();

export default OBJECT_INSTANCE_FORMAT_CONTEXT;
