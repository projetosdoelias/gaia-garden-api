import { plainToInstance } from 'class-transformer';
import {
  registerDecorator,
  ValidateIf,
  validateSync,
  ValidationArguments,
  ValidationError,
  ValidationOptions,
} from 'class-validator';
import { PLANT_LOG_TYPE_CONFIG, PlantLogType } from '../plant-log-types';

/** ISO 8601 date-time with an explicit offset, so it is never parsed as local time. */
export const ISO_DATETIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
export const ISO_DATETIME_MESSAGE =
  '$property must be an ISO 8601 date-time with offset, e.g. 2026-11-01T00:00:00Z';

/** Clock-skew tolerance for client-supplied timestamps. */
export const FUTURE_TOLERANCE_MS = 60_000;

/**
 * Like `@IsOptional()`, but only skips validation when the field is absent.
 * An explicit `null` still runs the other validators and is rejected.
 */
export function IsOptionalNotNull(
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateIf(
    (_object: object, value: unknown) => value !== undefined,
    options,
  );
}

export function IsNotFutureDate(
  options?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isNotFutureDate',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: { message: '$property must not be in the future', ...options },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true; // format checked elsewhere
          const time = Date.parse(value);
          return Number.isNaN(time) || time <= Date.now() + FUTURE_TOLERANCE_MS;
        },
      },
    });
  };
}

function flattenErrors(errors: ValidationError[], prefix = ''): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}).map((m) => `${prefix}${m}`),
    ...flattenErrors(error.children ?? [], `${prefix}${error.property}.`),
  ]);
}

/**
 * Validates `details` against the DTO registered for the sibling `type`
 * in PLANT_LOG_TYPE_CONFIG. Types without a details DTO reject any details.
 */
export function IsDetailsValidForType(
  options?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    const errorsByValue = new WeakMap<object, string[]>();

    registerDecorator({
      name: 'isDetailsValidForType',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const { type } = args.object as { type?: PlantLogType };
          const config = type ? PLANT_LOG_TYPE_CONFIG[type] : undefined;
          if (!config) return true; // invalid type is reported on `type`

          if (!config.details) return false;
          if (
            typeof value !== 'object' ||
            value === null ||
            Array.isArray(value)
          ) {
            return false;
          }

          const instance = plainToInstance(config.details, value);
          const messages = flattenErrors(
            validateSync(instance, {
              whitelist: true,
              forbidNonWhitelisted: true,
            }),
          );
          errorsByValue.set(value, messages);
          return messages.length === 0;
        },
        defaultMessage(args: ValidationArguments) {
          const { type } = args.object as { type?: PlantLogType };
          const config = type ? PLANT_LOG_TYPE_CONFIG[type] : undefined;
          if (!config?.details) {
            return `details is not accepted for type ${String(type)}`;
          }
          const value: unknown = args.value;
          const messages =
            typeof value === 'object' && value !== null
              ? errorsByValue.get(value)
              : undefined;
          return messages?.length
            ? `details: ${messages.join('; ')}`
            : 'details must be an object';
        },
      },
    });
  };
}
