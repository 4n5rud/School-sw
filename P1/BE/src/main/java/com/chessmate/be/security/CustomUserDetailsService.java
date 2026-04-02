package com.chessmate.be.security;

import com.chessmate.be.entity.Member;
import com.chessmate.be.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        return new User(
                member.getEmail(),
                member.getPassword(),
                getAuthorities(member.getRole())
        );
    }

    /**
     * Role을 기반으로 권한 설정
     */
    private Collection<? extends GrantedAuthority> getAuthorities(String role) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        if (role != null) {
            String roleString = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            authorities.add(new SimpleGrantedAuthority(roleString));
        }

        return authorities;
    }
}

