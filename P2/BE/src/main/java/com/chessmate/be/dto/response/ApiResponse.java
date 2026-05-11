package com.chessmate.be.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

  private boolean success;
  private T data;
  private String message;

  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime timestamp;

  public static <T> ApiResponse<T> success(T data, String message) {
    return ApiResponse.<T>builder()
        .success(true)
        .data(data)
        .message(message)
        .timestamp(LocalDateTime.now())
        .build();
  }

  public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder()
        .success(true)
        .data(data)
        .message("조회되었습니다.")
        .timestamp(LocalDateTime.now())
        .build();
  }

  public static <T> ApiResponse<T> error(String message) {
    return ApiResponse.<T>builder()
        .success(false)
        .data(null)
        .message(message)
        .timestamp(LocalDateTime.now())
        .build();
  }
}

