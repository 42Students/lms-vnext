package com._42students.lms.service;


import com._42students.lms.model.Role;

public interface RoleService {
    Role findByName(String name);
}

