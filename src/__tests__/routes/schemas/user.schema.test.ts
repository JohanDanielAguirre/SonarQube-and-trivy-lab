import { createUserSchema, idParamSchema, roleEnum, updateUserSchema } from '../../../routes/schemas/user.schema';

describe('User Schema Tests', () => {
  describe('roleEnum', () => {
    it('should accept valid roles', () => {
      expect(roleEnum.parse('user')).toBe('user');
      expect(roleEnum.parse('superadmin')).toBe('superadmin');
    });

    it('should reject invalid roles', () => {
      expect(() => roleEnum.parse('invalid')).toThrow();
    });
  });

  describe('createUserSchema', () => {
    it('should validate correct user data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user' as const
      };

      const result = createUserSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should use default role when not provided', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = createUserSchema.parse(userData);
      expect(result.role).toBe('user');
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial updates', () => {
      const updateData = {
        name: 'Jane Doe'
      };

      const result = updateUserSchema.parse(updateData);
      expect(result).toEqual(updateData);
    });

    it('should reject empty updates', () => {
      expect(() => updateUserSchema.parse({})).toThrow();
    });

    it('should validate multiple fields', () => {
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'superadmin' as const
      };

      const result = updateUserSchema.parse(updateData);
      expect(result).toEqual(updateData);
    });
  });

  describe('idParamSchema', () => {
    it('should validate correct ObjectId', () => {
      const validId = { id: '507f1f77bcf86cd799439011' };
      const result = idParamSchema.parse(validId);
      expect(result).toEqual(validId);
    });

    it('should reject invalid ObjectId', () => {
      const invalidId = { id: 'invalid-id' };
      expect(() => idParamSchema.parse(invalidId)).toThrow();
    });
  });
});