package com.example.backend;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private final AppUserRepository appUserRepository;
	private final PasswordEncoder passwordEncoder;

	public AuthService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
		this.appUserRepository = appUserRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public AppUser signup(String username, String rawPassword) {
		Optional<AppUser> existing = appUserRepository.findByUsername(username);
		if (existing.isPresent()) {
			throw new IllegalArgumentException("Username already exists");
		}
		AppUser user = new AppUser();
		user.setUsername(username);
		user.setPasswordHash(passwordEncoder.encode(rawPassword));
		return appUserRepository.save(user);
	}

	public boolean login(String username, String rawPassword) {
		Optional<AppUser> userOpt = appUserRepository.findByUsername(username);
		if (userOpt.isEmpty()) {
			return false;
		}
		return passwordEncoder.matches(rawPassword, userOpt.get().getPasswordHash());
	}

}


