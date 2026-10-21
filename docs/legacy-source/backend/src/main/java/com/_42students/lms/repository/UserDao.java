package com._42students.lms.repository;

import com._42students.lms.model.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserDao extends CrudRepository<User, Long> {
    User findByUserName(String userName);
    
    /**
     * Find user by email (case-insensitive)
     * Used to prevent duplicate account creation
     */
    Optional<User> findByEmailIgnoreCase(String email);
    
    /**
     * Find user by phone number
     * Used to prevent duplicate account creation
     */
    Optional<User> findByPhone(String phone);
}
