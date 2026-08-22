import { BadRequestException } from "@nestjs/common";
import type { ValidationError } from "class-validator";

import { apiError } from "./api-error.js";

interface ValidationDetail {
  field: string;
  code: string;
  params?: Record<string, string | number | boolean>;
}

const CONSTRAINT_CODES: Record<string, string> = {
  isDefined: "REQUIRED",
  isNotEmpty: "REQUIRED",
  isEmail: "INVALID_EMAIL",
  isString: "INVALID_TYPE",
  length: "INVALID_LENGTH",
  minLength: "TOO_SHORT",
};

function constraintParams(
  constraint: string,
  error: ValidationError
): Record<string, string | number | boolean> | undefined {
  const value = error.contexts?.[constraint];
  if (!value || typeof value !== "object") return undefined;
  const params: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    )
      params[key] = item;
  }
  return params;
}

function details(
  errors: ValidationError[],
  parent = ""
): ValidationDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.keys(error.constraints ?? {}).map((constraint) => ({
      field,
      code: CONSTRAINT_CODES[constraint] ?? constraint.toUpperCase(),
      ...(constraintParams(constraint, error)
        ? { params: constraintParams(constraint, error) }
        : {}),
    }));
    return [...own, ...details(error.children ?? [], field)];
  });
}

export function validationException(errors: ValidationError[]) {
  return new BadRequestException(
    apiError(
      "VALIDATION_ERROR",
      "Request validation failed",
      details(errors)
    )
  );
}
