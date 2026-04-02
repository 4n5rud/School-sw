package com.chessmate.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

  private T data;
  private String message;

  public static <T> ApiResponse<T> success(T data, String message) {
    return ApiResponse.<T>builder()
        .data(data)
        .message(message)
        .build();
  }

  public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder()
        .data(data)
        .message("Success")
        .build();
  }

  public static <T> ApiResponse<T> error(String message) {
    return ApiResponse.<T>builder()
        .data(null)
        .message(message)
        .build();
  }
}

