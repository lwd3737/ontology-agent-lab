import type { PipelineStepResult } from "@/connector/prisma/prisma-queries-result-translator";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import type { PrismaQueryResult } from "@/connector/prisma/prisma-query-executor";
import { isEqual } from "lodash";
import PrismaSchemaMapper from "@/connector/prisma/schema-mapping/schema-mapper";

type InstanceComparison = {
  index: number;
  issues: string[];
  missingRequestedProperties: string[];
  propertyValueMismatches: Array<{
    propertyId: string;
    expected: unknown;
    actual: unknown;
  }>;
};

type StepEvaluation = {
  index: number;
  stepName: string;
  objectType: string;
  isSuccess: boolean;
  details: {
    stepNameMatched: boolean;
    objectTypeMatched: boolean;
    instanceCount: {
      expected: number;
      actual: number;
    };
    instanceComparisons: InstanceComparison[];
    extraInstanceIndexes: number[];
    missingOutputStep?: boolean;
  };
};

/**
 * Evaluation metric (direct comparison against inputs):
 * 1. Pipeline step count must match the DSL pipeline length.
 * 2. Each step must preserve the DSL-defined name and object type.
 * 3. Each step must return the same number of instances as the raw Prisma
 *    query result (positionally compared).
 * 4. Each object instance must contain all requested properties and those
 *    values must equal the original Prisma record values.
 */
const prismaSchemaMapper = PrismaSchemaMapper.create();

const prismaQueriesResultTranslationEvaluator = ({
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

  const expectedStepCount = queryDSL.pipeline.length;
  const actualStepCount = pipelineResult.length;

  if (expectedStepCount !== actualStepCount) {
    return {
      key: "isTranslatedCorrectly",
      score: 0,
      details: {
        stepCountMismatch: {
          expected: expectedStepCount,
          actual: actualStepCount,
        },
        steps: [],
      },
    };
  }

  const stepEvaluations: StepEvaluation[] = queryDSL.pipeline.map(
    (dslStep, stepIndex) => {
      const expectedObjectType = dslStep.query.objectType;
      const requestedProperties = dslStep.query.properties ?? [];
      const expectedQueryResult = queriesResult[stepIndex] ?? [];
      const expectedInstances = expectedQueryResult.map((row) => {
        const primaryKeyField = prismaSchemaMapper.mapToPrismaPrimaryKeyField(
          expectedObjectType,
          row
        );
        const ontologyProperties = prismaSchemaMapper.mapToOntologyProperties(
          row,
          expectedObjectType
        );

        return {
          rid: primaryKeyField.value,
          objectType: expectedObjectType,
          properties: ontologyProperties,
          raw: row,
        };
      });
      const pipelineStep = pipelineResult[stepIndex];

      if (!pipelineStep) {
        return {
          index: stepIndex,
          stepName: dslStep.name,
          objectType: expectedObjectType,
          isSuccess: false,
          details: {
            stepNameMatched: false,
            objectTypeMatched: false,
            instanceCount: {
              expected: expectedInstances.length,
              actual: 0,
            },
            instanceComparisons: [],
            extraInstanceIndexes: [],
            missingOutputStep: true,
          },
        };
      }

      const actualObjectInstances = pipelineStep.objectInstances ?? [];

      const stepDetails: StepEvaluation["details"] = {
        stepNameMatched: pipelineStep.stepName === dslStep.name,
        objectTypeMatched: pipelineStep.objectType === expectedObjectType,
        instanceCount: {
          expected: expectedInstances.length,
          actual: actualObjectInstances.length,
        },
        instanceComparisons: [],
        extraInstanceIndexes: [],
      };

      if (expectedInstances.length !== actualObjectInstances.length) {
        return {
          index: stepIndex,
          stepName: pipelineStep.stepName,
          objectType: pipelineStep.objectType,
          isSuccess: false,
          details: stepDetails,
        };
      }

      const maxInstanceCount = Math.max(
        expectedInstances.length,
        actualObjectInstances.length
      );

      for (let i = 0; i < maxInstanceCount; i++) {
        const expectedInstance = expectedInstances[i];
        const actualObjectInstance = actualObjectInstances[i];

        if (!expectedInstance) {
          stepDetails.extraInstanceIndexes.push(i);
          continue;
        }

        if (!actualObjectInstance) {
          stepDetails.instanceComparisons.push({
            index: i,
            issues: ["missingInstance"],
            missingRequestedProperties: requestedProperties.slice(),
            propertyValueMismatches: [],
          });
          continue;
        }

        const comparison: InstanceComparison = {
          index: i,
          issues: [],
          missingRequestedProperties: [],
          propertyValueMismatches: [],
        };

        if (actualObjectInstance.objectType !== expectedObjectType) {
          comparison.issues.push("objectTypeMismatch");
        }

        if (!actualObjectInstance.rid) {
          comparison.issues.push("missingRid");
        }

        const actualProperties = actualObjectInstance.properties ?? {};
        const actualPropertyIds = Object.keys(actualProperties);

        // Only enforce requested properties when they were explicitly asked for
        const missingRequested = requestedProperties.filter(
          (propertyId) => !actualPropertyIds.includes(propertyId)
        );

        if (missingRequested.length > 0) {
          comparison.missingRequestedProperties.push(...missingRequested);
        }

        const propertiesToCheck =
          requestedProperties.length > 0
            ? requestedProperties
            : Object.keys(expectedInstance.properties);

        propertiesToCheck.forEach((propertyId) => {
          const expectedValue = expectedInstance.properties[propertyId];
          const actualValue = actualProperties[propertyId];

          if (
            !Object.prototype.hasOwnProperty.call(actualProperties, propertyId)
          ) {
            comparison.missingRequestedProperties.push(propertyId);
            return;
          }

          if (!isEqual(expectedValue, actualValue)) {
            comparison.propertyValueMismatches.push({
              propertyId,
              expected: expectedValue,
              actual: actualValue,
            });
          }
        });

        stepDetails.instanceComparisons.push(comparison);
      }

      const isSuccess =
        stepDetails.stepNameMatched &&
        stepDetails.objectTypeMatched &&
        stepDetails.instanceCount.expected ===
          stepDetails.instanceCount.actual &&
        stepDetails.extraInstanceIndexes.length === 0 &&
        stepDetails.instanceComparisons.every((comparison) => {
          return (
            comparison.issues.length === 0 &&
            comparison.missingRequestedProperties.length === 0 &&
            comparison.propertyValueMismatches.length === 0
          );
        });

      return {
        index: stepIndex,
        stepName: pipelineStep.stepName,
        objectType: pipelineStep.objectType,
        isSuccess,
        details: stepDetails,
      };
    }
  );

  const successfulSteps = stepEvaluations.filter(
    (step) => step.isSuccess
  ).length;
  const score =
    expectedStepCount === 0 ? 0 : successfulSteps / expectedStepCount;

  return {
    key: "isTranslatedCorrectly",
    score,
    details: {
      stepCount: expectedStepCount,
      steps: stepEvaluations,
    },
  };
};

export default prismaQueriesResultTranslationEvaluator;
