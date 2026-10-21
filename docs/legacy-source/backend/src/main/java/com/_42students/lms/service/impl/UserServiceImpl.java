package com._42students.lms.service.impl;

import com._42students.lms.dto.request.UserDto;
import com._42students.lms.dto.response.ContactDTO;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.Role;
import com._42students.lms.model.User;
import com._42students.lms.repository.UserDao;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.RoleService;
import com._42students.lms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service//(value = "userService")
public class UserServiceImpl implements UserDetailsService, UserService {

    @Autowired
    private RoleService roleService;

    @Autowired
    private UserDao userDao;

    @Autowired
    private LearnerService learnerService;

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private BCryptPasswordEncoder bcryptEncoder;

    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userDao.findByUserName(username);
        if(user == null){
            throw new UsernameNotFoundException("Invalid username or password.");
        }
        // AC-01: deleted users must not be able to log in
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new UsernameNotFoundException("Invalid username or password.");
        }
        return new org.springframework.security.core.userdetails.User(user.getUserName(), user.getPassword(), getAuthority(user));
    }

    private Set<SimpleGrantedAuthority> getAuthority(User user) {
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();
        user.getRoles().forEach(role -> {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
        });
        return authorities;
    }

    public List<User> findAll() {
        List<User> list = new ArrayList<>();
        userDao.findAll().iterator().forEachRemaining(list::add);
        return list;
    }

    @Override
    public User findOne(String username) {
        return userDao.findByUserName(username);
    }

    @Override
    public List<ContactDTO> getContacts(String userType, int collegeId) {
        List<Learner> learnerList = learnerService.fetchContactsByCollegeId(collegeId);
        List<Faculty> facultyList = facultyService.fetchContactsByCollegeId(collegeId);
        List<ContactDTO> contactDTOList = new ArrayList<>();
        if("faculty".equalsIgnoreCase(userType)){
            for (Faculty faculty : facultyList) {
                ContactDTO contactDTO = new ContactDTO();
                contactDTO.setContactMobile(faculty.getContactMobile());
                contactDTO.setContactPhone(faculty.getContactPhone());
                contactDTO.setUserType(faculty.getUserType());
                contactDTO.setEmail(faculty.getContactMail());
                contactDTO.setFirstName(faculty.getFirstName());
                contactDTO.setLastName(faculty.getLastName());
                contactDTO.setProfileImageUrl(faculty.getWebsite());
                contactDTOList.add(contactDTO);
            }
        }
        else if("learner".equalsIgnoreCase(userType) || "student".equalsIgnoreCase((userType))){
            for (Learner learner : learnerList) {
                ContactDTO contactDTO = new ContactDTO();
                contactDTO.setContactMobile(learner.getContactMobile());
                contactDTO.setContactPhone(learner.getContactPhone());
                contactDTO.setUserType(learner.getUserType());
                contactDTO.setEmail(learner.getContactMail());
                contactDTO.setFirstName(learner.getFirstName());
                contactDTO.setLastName(learner.getLastName());
                contactDTO.setProfileImageUrl(learner.getWebsite());
                contactDTOList.add(contactDTO);
            }
        }
        else{
            for (Faculty faculty : facultyList) {
                ContactDTO contactDTO = new ContactDTO();
                contactDTO.setContactMobile(faculty.getContactMobile());
                contactDTO.setContactPhone(faculty.getContactPhone());
                contactDTO.setUserType(faculty.getUserType());
                contactDTO.setEmail(faculty.getContactMail());
                contactDTO.setFirstName(faculty.getFirstName());
                contactDTO.setLastName(faculty.getLastName());
                contactDTO.setProfileImageUrl(faculty.getWebsite());
                contactDTOList.add(contactDTO);
            }
            for (Learner learner : learnerList) {
                ContactDTO contactDTO = new ContactDTO();
                contactDTO.setContactMobile(learner.getContactMobile());
                contactDTO.setContactPhone(learner.getContactPhone());
                contactDTO.setUserType(learner.getUserType());
                contactDTO.setEmail(learner.getContactMail());
                contactDTO.setFirstName(learner.getFirstName());
                contactDTO.setLastName(learner.getLastName());
                contactDTO.setProfileImageUrl(learner.getWebsite());
                contactDTOList.add(contactDTO);
            }
        }


        return contactDTOList;
    }


    @Override
    public User save(UserDto user) {
        // Check for duplicate username
        if (user.getUserName() != null && !user.getUserName().trim().isEmpty()) {
            User existingUserByUsername = userDao.findByUserName(user.getUserName());
            if (existingUserByUsername != null) {
                throw new RuntimeException("Username already exists. Please choose a different username.");
            }
        }

        // Check for duplicate email
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            userDao.findByEmailIgnoreCase(user.getEmail().trim())
                    .ifPresent(existingUser -> {
                        throw new RuntimeException("Email already exists. Please use a different email address.");
                    });
        }

        // Check for duplicate phone
        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
            userDao.findByPhone(user.getPhone().trim())
                    .ifPresent(existingUser -> {
                        throw new RuntimeException("Phone number already exists. Please use a different phone number.");
                    });
        }

        User nUser = new User();//user.getUserFromDto();
        nUser.setUserName(user.getUserName());
        nUser.setPassword(bcryptEncoder.encode(user.getPassword()));
        nUser.setName(user.getName());
        nUser.setEmail(user.getEmail());
        nUser.setBusinessTitle(user.getBusinessTitle());
        nUser.setPhone(user.getPhone());


        Role role = roleService.findByName("USER");
        Set<Role> roleSet = new HashSet<>();
        roleSet.add(role);

        //if(nUser.getEmail().split("@")[1].equals("admin.edu")){
            role = roleService.findByName("ADMIN");
            roleSet.add(role);
        //}

        nUser.setRoles(roleSet);
        return userDao.save(nUser);
    }


   
    

}

