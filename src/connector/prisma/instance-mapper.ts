import { OntologyToPrismaMapping } from "./mapping";

/**
 * Prisma 필드명을 온톨로지 propertyId로 변환
 * @param objectType 온톨로지 objectType id
 * @param prismaFieldName Prisma 모델 필드명
 * @returns 온톨로지 propertyId, 매핑을 찾을 수 없으면 null
 */
export const getPropertyIdFromPrismaField = (
  objectType: string,
  prismaFieldName: string
): string | null => {
  const mapping = OntologyToPrismaMapping[objectType];
  if (!mapping) {
    return null;
  }

  // propertyId -> { name: prismaFieldName } 구조를 역매핑
  for (const [propertyId, fieldMapping] of Object.entries(mapping.fields)) {
    if (fieldMapping.name === prismaFieldName) {
      return propertyId;
    }
  }

  return null;
};

/**
 * 온톨로지 objectType에 해당하는 Prisma 모델명 반환
 * @param objectType 온톨로지 objectType id
 * @returns Prisma 모델명, 매핑을 찾을 수 없으면 null
 */
export const getPrismaModelFromObjectType = (
  objectType: string
): string | null => {
  const mapping = OntologyToPrismaMapping[objectType];
  if (!mapping) {
    return null;
  }

  return mapping.model;
};

/**
 * 온톨로지 objectType에 해당하는 모든 필드 매핑 정보 반환
 * @param objectType 온톨로지 objectType id
 * @returns Prisma 필드명 -> propertyId 매핑 객체, 매핑을 찾을 수 없으면 null
 */
export const getFieldMappingForObjectType = (
  objectType: string
): Record<string, string> | null => {
  const mapping = OntologyToPrismaMapping[objectType];
  if (!mapping) {
    return null;
  }

  const reverseMapping: Record<string, string> = {};
  for (const [propertyId, fieldMapping] of Object.entries(mapping.fields)) {
    reverseMapping[fieldMapping.name] = propertyId;
  }

  return reverseMapping;
};

