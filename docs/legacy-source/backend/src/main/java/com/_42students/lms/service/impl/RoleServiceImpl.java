package com._42students.lms.service.impl;


import com._42students.lms.model.Role;
import com._42students.lms.repository.RoleDao;
import com._42students.lms.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service(value = "roleService")
public class RoleServiceImpl implements RoleService {

    @Autowired
    private RoleDao roleDao;

    @Override
    public Role findByName(String name) {
        Role role = roleDao.findRoleByName(name);
        return role;
    }
}

