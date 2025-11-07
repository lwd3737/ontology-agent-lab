import type { PipelineStepResult } from "@/connector/prisma/prisma-queries-result-translator";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import type { PrismaQueryResult } from "@/connector/prisma/prisma-query-executor";
import { isEqual } from "lodash";
import PrismaSchemaMapper from "@/connector/prisma/schema-mapping/schema-mapper";
import type { ObjectInstance } from "@/ontology/ontology-instance";

type ObjectInstanceComparison = {
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
    instanceComparisons: ObjectInstanceComparison[];
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
    (dslStep, stepIndex) =>
      evaluateStep(
        dslStep,
        pipelineResult[stepIndex],
        queriesResult[stepIndex],
        stepIndex
      )
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

const evaluateStep = (
  dslStep: OntologyQueryDSL["pipeline"][number],
  pipelineStep: PipelineStepResult | undefined,
  queryResult: PrismaQueryResult | undefined,
  stepIndex: number
): StepEvaluation => {
  const expectedObjectType = dslStep.query.objectType;
  const requestedProperties = dslStep.query.properties ?? [];
  const expectedObjectInstances = buildExpectedObjectInstances(
    expectedObjectType,
    queryResult
  );

  if (!pipelineStep) {
    return createMissingStepEvaluation(
      dslStep,
      expectedObjectInstances.length,
      stepIndex
    );
  }

  const actualObjectInstances = pipelineStep.objectInstances ?? [];

  const details: StepEvaluation["details"] = {
    stepNameMatched: pipelineStep.stepName === dslStep.name,
    objectTypeMatched: pipelineStep.objectType === expectedObjectType,
    instanceCount: {
      expected: expectedObjectInstances.length,
      actual: actualObjectInstances.length,
    },
    instanceComparisons: [],
    extraInstanceIndexes: [],
  };

  if (details.instanceCount.expected !== details.instanceCount.actual) {
    return {
      index: stepIndex,
      stepName: pipelineStep.stepName,
      objectType: pipelineStep.objectType,
      isSuccess: false,
      details,
    };
  }

  for (let index = 0; index < expectedObjectInstances.length; index++) {
    const expectedObjectInstance = expectedObjectInstances[index];
    const actualObjectInstance = actualObjectInstances[index];

    if (!actualObjectInstance) {
      details.instanceComparisons.push({
        index,
        issues: ["missingInstance"],
        missingRequestedProperties: requestedProperties,
        propertyValueMismatches: [],
      });
      continue;
    }

    details.instanceComparisons.push(
      compareObjectInstance(
        expectedObjectInstance,
        actualObjectInstance,
        requestedProperties,
        expectedObjectType,
        index
      )
    );
  }

  return {
    index: stepIndex,
    stepName: pipelineStep.stepName,
    objectType: pipelineStep.objectType,
    isSuccess: isStepSuccessful(details),
    details,
  };
};

const buildExpectedObjectInstances = (
  objectType: string,
  queryResult: PrismaQueryResult | undefined
): ObjectInstance[] => {
  const modelInstances = queryResult ?? [];
  return modelInstances.map((modelInstance) => {
    const primaryKeyField = prismaSchemaMapper.mapToPrismaPrimaryKeyField(
      objectType,
      modelInstance
    );
    const ontologyProperties = prismaSchemaMapper.mapToOntologyProperties(
      modelInstance,
      objectType
    );

    return {
      rid: primaryKeyField.value,
      objectType,
      properties: ontologyProperties,
    };
  });
};

const createMissingStepEvaluation = (
  dslStep: OntologyQueryDSL["pipeline"][number],
  expectedInstanceCount: number,
  stepIndex: number
): StepEvaluation => ({
  index: stepIndex,
  stepName: dslStep.name,
  objectType: dslStep.query.objectType,
  isSuccess: false,
  details: {
    stepNameMatched: false,
    objectTypeMatched: false,
    instanceCount: {
      expected: expectedInstanceCount,
      actual: 0,
    },
    instanceComparisons: [],
    extraInstanceIndexes: [],
    missingOutputStep: true,
  },
});

const compareObjectInstance = (
  expectedObjectInstance: ObjectInstance,
  actualObjectInstance: PipelineStepResult["objectInstances"][number],
  requestedProperties: string[],
  expectedObjectType: string,
  instanceIndex: number
): ObjectInstanceComparison => {
  const comparison: ObjectInstanceComparison = {
    index: instanceIndex,
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

  requestedProperties
    .filter((propertyId) => !actualPropertyIds.includes(propertyId))
    .forEach((propertyId) => {
      if (!comparison.missingRequestedProperties.includes(propertyId)) {
        comparison.missingRequestedProperties.push(propertyId);
      }
    });

  actualPropertyIds
    .filter((propertyId) => !expectedObjectInstance.properties[propertyId])
    .forEach((propertyId) => {
      comparison.issues.push(`unexpectedProperty:${propertyId}`);
    });

  requestedProperties.forEach((propertyId) => {
    if (!actualProperties[propertyId]) {
      if (!comparison.missingRequestedProperties.includes(propertyId)) {
        comparison.missingRequestedProperties.push(propertyId);
      }
      return;
    }

    const expectedValue = expectedObjectInstance.properties[propertyId];
    const actualValue = actualProperties[propertyId];

    if (!isEqual(expectedValue, actualValue)) {
      comparison.propertyValueMismatches.push({
        propertyId,
        expected: expectedValue,
        actual: actualValue,
      });
    }
  });

  return comparison;
};

const isStepSuccessful = (details: StepEvaluation["details"]): boolean =>
  details.stepNameMatched &&
  details.objectTypeMatched &&
  details.instanceCount.expected === details.instanceCount.actual &&
  details.extraInstanceIndexes.length === 0 &&
  details.instanceComparisons.every(
    (comparison) =>
      comparison.issues.length === 0 &&
      comparison.missingRequestedProperties.length === 0 &&
      comparison.propertyValueMismatches.length === 0
  );
