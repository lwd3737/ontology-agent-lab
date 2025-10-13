import OntologyDefinition from "@/ontology/definition";
import OntologyTranslator from "./ontology-translator";

const translator = new OntologyTranslator(OntologyDefinition);
const prompt = translator.translate();

console.log(prompt);
