import { ClassConstructor } from 'class-transformer';
import { PlantLogType } from '../generated/prisma/enums';

export { PlantLogType };

export interface PlantLogTypeConfig {
  /**
   * DTO class that validates the `details` payload for this type.
   * Omit it when the type takes no details (they are then rejected).
   */
  details?: ClassConstructor<object>;
}

/**
 * Registry of log types the API currently accepts on write.
 * To enable a new type, add an entry here (and its details DTO, if any).
 * The enum already contains every planned type, so no migration is needed.
 */
export const PLANT_LOG_TYPE_CONFIG: Partial<
  Record<PlantLogType, PlantLogTypeConfig>
> = {
  [PlantLogType.OBSERVATION]: {},
};

export const ENABLED_PLANT_LOG_TYPES = Object.keys(
  PLANT_LOG_TYPE_CONFIG,
) as PlantLogType[];
