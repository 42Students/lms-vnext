package com._42students.lms.security;

import com._42students.lms.service.tpo.TpoTeamService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The placement team is the TPO admins only (coordinator roles removed on 9 Oct 2026): a faculty member added as TPO admin
 * reaches everything under /api/v1/tpo; any other faculty member gets 403, except asking "am I on the team?" (my-access).
 */
class TpoTeamAccessFilterTest {

    private final TpoTeamService team = mock(TpoTeamService.class);
    private final SecurityContextUtil ctx = mock(SecurityContextUtil.class);
    private final TpoTeamAccessFilter filter = new TpoTeamAccessFilter(team, ctx);
    private final UserPrincipal faculty = new UserPrincipal(77, "FACULTY", "FACULTY", 1, 6, 0);

    @BeforeEach
    void signInAsFaculty() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(faculty, null, List.of(new SimpleGrantedAuthority("ROLE_FACULTY"))));
        when(ctx.getAuthenticatedUserPrincipal()).thenReturn(faculty);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private int status(String method, String path) throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest(method, path);
        req.setRequestURI(path);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, new MockFilterChain());
        return res.getStatus();
    }

    @Test
    void aTeamTpoAdminReachesEverything() throws Exception {
        when(team.roleOf(any())).thenReturn(TpoTeamService.TPO_ADMIN);
        assertEquals(200, status("GET", "/api/v1/tpo/settings/seasons"));
        assertEquals(200, status("POST", "/api/v1/tpo/team"));
        assertEquals(200, status("POST", "/api/v1/tpo/drive-day/5/mark"));
    }

    @Test
    void facultyOffTheTeamIsTurnedAway() throws Exception {
        when(team.roleOf(any())).thenReturn(null);
        assertEquals(403, status("GET", "/api/v1/tpo/students/table"));
        assertEquals(403, status("GET", "/api/v1/tpo/drive-day/mine"));
        assertEquals(403, status("POST", "/api/v1/tpo/views"));
    }

    @Test
    void facultyOffTheTeamCanStillAskWhetherTheyAreOnIt() throws Exception {
        when(team.roleOf(any())).thenReturn(null);
        assertEquals(200, status("GET", "/api/v1/tpo/my-access"));
    }
}
