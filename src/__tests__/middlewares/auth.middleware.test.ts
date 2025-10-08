import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../../middlewares/auth.middleware";

// Mock jwt
jest.mock("jsonwebtoken");
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe("Auth Middleware - Basic Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    req = {
      headers: {}
    };
    res = {
      json: jsonMock,
      status: statusMock
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  it("should authenticate user with valid token", () => {
    // Arrange
    req.headers!.authorization = "Bearer validtoken123";
    const mockPayload = { sub: "userId123", role: "user" };
    mockJwt.verify.mockReturnValue(mockPayload as any);

    // Act
    requireAuth(req as Request, res as Response, next);

    // Assert
    const expectedSecret = process.env.JWT_SECRET || "change-me";
    expect(mockJwt.verify).toHaveBeenCalledWith("validtoken123", expectedSecret);
    expect(req.user).toEqual(mockPayload);
    expect(next).toHaveBeenCalled();
  });

  it("should reject request without token", () => {
    // Arrange
    req.headers!.authorization = "";

    // Act
    requireAuth(req as Request, res as Response, next);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Missing token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject request with invalid token", () => {
    // Arrange
    req.headers!.authorization = "Bearer invalidtoken";
    mockJwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    // Act
    requireAuth(req as Request, res as Response, next);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });
});