export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: number;
}

export class ResponseBuilder {
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: Date.now()
    };
  }

  static error(message: string): ApiResponse {
    return {
      success: false,
      message,
      timestamp: Date.now()
    };
  }
}
