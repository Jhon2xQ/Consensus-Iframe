export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export class ResponseBuilder {
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      data
    };
  }

  static error(message: string): ApiResponse {
    return {
      success: false,
      message
    };
  }
}
