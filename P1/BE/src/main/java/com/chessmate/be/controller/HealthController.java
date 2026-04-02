package com.chessmate.be.controller;

import com.chessmate.be.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    /**
     * 헬스 체크 엔드포인트
     */
    @GetMapping
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Server is running", "Health check passed"));
    }
}

