package com._42students.lms.service;

import com._42students.lms.dto.response.ContactDTO;
import com._42students.lms.model.User;
import com._42students.lms.dto.request.UserDto;

import java.util.List;

public interface UserService {
    User save(UserDto user);
    List<User> findAll();
    User findOne(String userName); 

    List<ContactDTO> getContacts(String userType, int collegeId);
    
}

