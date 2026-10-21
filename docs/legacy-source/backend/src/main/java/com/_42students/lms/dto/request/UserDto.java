package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class UserDto {

    @NotBlank @Size(max = 255)
    private String userName;
    @NotBlank @Size(max = 255)
    private String password;
    @Email @Size(max = 255)
    private String email;
    @Size(max = 20)
    private String phone;
    @Size(max = 255)
    private String name;
    @Size(max = 255)
    private String businessTitle;

//    public User getUserFromDto(){
//        User user = new User();
//        user.setUserName(userName);
//        user.setPassword(password);
//        user.setEmail(email);
//        user.setPhone(phone);
//        user.setName(name);
//        user.setBusinessTitle(businessTitle);
//
//        return user;
//    }
    
}
