import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';
import { UpdateEventDto } from './update-event.dto';

describe('Event DTOs validation', () => {
  describe('CreateEventDto', () => {
    it('should validate a valid dto', async () => {
      const dto = plainToInstance(CreateEventDto, {
        description: 'Watering the plants',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject when description is missing', async () => {
      const dto = plainToInstance(CreateEventDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when description is empty', async () => {
      const dto = plainToInstance(CreateEventDto, { description: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateEventDto', () => {
    it('should allow an empty update payload (field optional)', async () => {
      const dto = plainToInstance(UpdateEventDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject when description is empty string', async () => {
      const dto = plainToInstance(UpdateEventDto, { description: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});