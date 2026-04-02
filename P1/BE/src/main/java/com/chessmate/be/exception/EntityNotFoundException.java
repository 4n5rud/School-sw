package com.chessmate.be.exception;

/**
 * 엔티티를 찾을 수 없는 예외
 */
public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}

