import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { loginCtrl, registerCtrl } from "../../controllers/auth.controller";
import { UserModel } from "../../models/user.model";


jest.mock("../../models/user.model");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe("Auth Controller - Basic Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    req = { body: {} };
    res = {
      json: jsonMock,
      status: statusMock
    };
    
    jest.clearAllMocks();
  });

  describe("registerCtrl", () => {
    it("should register a new user successfully", async () => {
      // Arrange
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123"
      };

      mockUserModel.findOne.mockResolvedValue(null); // No existe el usuario
      mockBcrypt.hash.mockResolvedValue("hashedPassword123" as never);
      
      const mockUser = {
        id: "userId123",
        name: "Test User",
        email: "test@example.com",
        role: "user"
      };
      mockUserModel.create.mockResolvedValue(mockUser as any);

      // Act
      await registerCtrl(req as Request, res as Response);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        id: "userId123",
        name: "Test User", 
        email: "test@example.com",
        role: "user"
      });
    });

    it("should reject registration if email already exists", async () => {
      // Arrange
      req.body = {
        email: "existing@example.com",
        password: "password123"
      };

      mockUserModel.findOne.mockResolvedValue({ email: "existing@example.com" } as any);

      // Act
      await registerCtrl(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Email already in use" });
    });
  });

  describe("loginCtrl", () => {
    it("should login user with valid credentials", async () => {
      // Arrange
      req.body = {
        email: "test@example.com",
        password: "password123"
      };

      const mockUser = {
        id: "userId123",
        name: "Test User",
        email: "test@example.com", 
        role: "user",
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockJwt.sign.mockReturnValue("mockToken123" as never);

      // Act
      await loginCtrl(req as Request, res as Response);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(mockUser.comparePassword).toHaveBeenCalledWith("password123");
      expect(jsonMock).toHaveBeenCalledWith({
        token: "mockToken123",
        user: {
          id: "userId123",
          name: "Test User",
          email: "test@example.com",
          role: "user"
        }
      });
    });

    it("should reject login with invalid credentials", async () => {
      // Arrange
      req.body = {
        email: "nonexistent@example.com", 
        password: "password123"
      };

      mockUserModel.findOne.mockResolvedValue(null);

      // Act
      await loginCtrl(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });
  });

  describe("meCtrl", () => {
    it("should return user info from request", async () => {
      // Arrange
      req.user = {
        sub: "userId123",
        role: "user"
      };

      const { meCtrl } = await import("../../controllers/auth.controller");

      // Act
      await meCtrl(req as Request, res as Response);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith({
        sub: "userId123",
        role: "user"
      });
    });

    it("should handle undefined user", async () => {
      // Arrange
      req.user = undefined;

      const { meCtrl } = await import("../../controllers/auth.controller");

      // Act
      await meCtrl(req as Request, res as Response);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith({
        sub: undefined,
        role: undefined
      });
    });
  });
});