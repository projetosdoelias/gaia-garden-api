import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePlantDto } from './create-plant.dto';
import { UpdatePlantDto } from './update-plant.dto';

describe('Plant DTOs validation', () => {
  describe('CreatePlantDto', () => {
    it('should validate a valid dto', async () => {
      const dto = plainToInstance(CreatePlantDto, {
        name: 'Tomato',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject when name is missing', async () => {
      const dto = plainToInstance(CreatePlantDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when name is empty', async () => {
      const dto = plainToInstance(CreatePlantDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdatePlantDto', () => {
    it('should allow an empty update payload (all fields optional)', async () => {
      const dto = plainToInstance(UpdatePlantDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject when name is empty string', async () => {
      const dto = plainToInstance(UpdatePlantDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});