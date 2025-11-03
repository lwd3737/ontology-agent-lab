import type { PipelineStepResult } from "@/connector/prisma/query-result-to-ontology-translator";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import type { PrismaQueryResult } from "@/connector/prisma/prisma-query-executor";
import { isEqual } from "lodash";

const queryResultToOntologyTranslationEvaluator = ({
  inputs,
  outputs,
}: {
  inputs: {
    queryDSL: OntologyQueryDSL;
    queriesResult: PrismaQueryResult[];
  };
  outputs: { pipelineResult: PipelineStepResult[] };
}) => {
  const { queryDSL, queriesResult } = inputs;
  const { pipelineResult } = outputs;

  const stepCount = pipelineResult.length;

  if (queryDSL.pipeline.length !== stepCount) {
    return {
      key: "isTranslatedCorrectly",
      score: 0,
      details: {
        stepCountMismatch: true,
      },
    };
  }

  const pipelineResultDetails = pipelineResult.map((pipelineStepResult, i) => {
    const queryDSLPipelineStep = queryDSL.pipeline[i];

    const isStepNameMatched =
      pipelineStepResult.stepName === queryDSLPipelineStep.name;
    const isObjectTypeMatched =
      pipelineStepResult.objectType === queryDSLPipelineStep.query.objectType;

    const instanceDetails = pipelineStepResult.objectInstances.reduce(
      (result, objectInstance) => {
        const isRidMatched = "rid" in objectInstance;
        const isObjectTypeMatched =
          objectInstance.objectType === queryDSLPipelineStep.query.objectType;

        let isPropertyMatched = true;
        if (queryDSLPipelineStep.query.properties) {
          const isPropertyCountMatch =
            queryDSLPipelineStep.query.properties.length ===
            Object.keys(objectInstance.properties).length;
          const mismatchedPropertyIds = [
            ...Array.from(
              new Set(queryDSLPipelineStep.query.properties).difference(
                new Set(Object.keys(objectInstance.properties))
              )
            ),
            ...Array.from(
              new Set(Object.keys(objectInstance.properties)).difference(
                new Set(queryDSLPipelineStep.query.properties)
              )
            ),
          ];
          if (!isPropertyCountMatch || mismatchedPropertyIds.length > 0) {
            isPropertyMatched = false;
            mismatchedPropertyIds.forEach((propertyId) => {
              result.mismatchedInstanceAttributes.mismatchedProperties.push(
                propertyId
              );
            });
          }
        }

        if (!isRidMatched || !isObjectTypeMatched || !isPropertyMatched) {
          result.instanceAttributeMismatchCount++;
        }
        if (!isRidMatched) {
          result.mismatchedInstanceAttributes.mismatchedInstanceAttributes.push(
            "rid"
          );
        }
        if (!isObjectTypeMatched) {
          result.mismatchedInstanceAttributes.mismatchedInstanceAttributes.push(
            "objectType"
          );
        }
        if (!isPropertyMatched) {
          result.mismatchedInstanceAttributes.mismatchedInstanceAttributes.push(
            "properties"
          );
        }

        const queryResult = queriesResult[i];
        const isQueryValuesMatched = queryResult.every((modelInstance) =>
          isEqual(modelInstance, objectInstance)
        );
        if (!isQueryValuesMatched) {
          result.instanceValueMismatchCount++;
        }

        return result;
      },
      {
        instanceValueMismatchCount: 0,
        instanceAttributeMismatchCount: 0,
        mismatchedAttributes: [],
        mismatchedInstanceAttributes: {
          mismatchedInstanceAttributes: [],
          mismatchedProperties: [],
        },
      } as {
        instanceValueMismatchCount: number;
        instanceAttributeMismatchCount: number;
        mismatchedAttributes: string[];
        mismatchedInstanceAttributes: {
          mismatchedInstanceAttributes: string[];
          mismatchedProperties: string[];
        };
      }
    );

    return {
      index: i,
      stepName: pipelineStepResult.stepName,
      objectType: pipelineStepResult.objectType,
      isSuccess:
        isStepNameMatched &&
        isObjectTypeMatched &&
        instanceDetails.instanceAttributeMismatchCount === 0 &&
        instanceDetails.instanceValueMismatchCount === 0,
      details: {
        isStepNameMatched,
        isObjectTypeMatched,
        instanceDetails,
      },
    };
  });

  const pipelineStepCount = queryDSL.pipeline.length;
  const totalSuccessCount = pipelineResultDetails.reduce(
    (result, stepDetails) => {
      return stepDetails.isSuccess ? result + 1 : result;
    },
    0
  );

  return {
    key: "isTranslatedCorrectly",
    score: totalSuccessCount / pipelineStepCount,
    details: pipelineResultDetails,
  };
};

export default queryResultToOntologyTranslationEvaluator;
