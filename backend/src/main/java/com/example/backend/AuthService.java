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
	public AppUser signup(String email, String username, String rawPassword) {
		Optional<AppUser> existingByEmail = appUserRepository.findByEmail(email);
		if (existingByEmail.isPresent()) {
			throw new IllegalArgumentException("Email already exists");
		}
		Optional<AppUser> existingByUsername = appUserRepository.findByUsername(username);
		if (existingByUsername.isPresent()) {
			throw new IllegalArgumentException("Username already exists");
		}
		AppUser user = new AppUser();
		user.setEmail(email);
		user.setUsername(username);
		user.setPasswordHash(passwordEncoder.encode(rawPassword));
		return appUserRepository.save(user);
	}

	public boolean login(String email, String rawPassword) {
		Optional<AppUser> userOpt = appUserRepository.findByEmail(email);
		if (userOpt.isEmpty()) {
			return false;
		}
		return passwordEncoder.matches(rawPassword, userOpt.get().getPasswordHash());
	}

	public AppUser getUserByEmail(String email) {
		Optional<AppUser> userOpt = appUserRepository.findByEmail(email);
		return userOpt.orElse(null);
	}

}


