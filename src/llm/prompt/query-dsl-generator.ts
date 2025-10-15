const generateQueryDslPrompt = (ontologyContext: string) => {
  return `
Role: Translate the user's natural-language request into a QueryDSL object for ORM/DB querying using the provided ontology.

Return ONLY a JSON object that conforms to the provided schema. Do not include explanations or code fences.



${ontologyContext}
  `.trim();
};

export default generateQueryDslPrompt;
